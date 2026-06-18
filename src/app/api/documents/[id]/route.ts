import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      control: true,
      uploader: { select: { name: true, email: true } },
      auditLogs: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(document);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await request.json();
  const userId = (session.user as { id?: string }).id!;

  const document = await prisma.document.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      version: body.version,
      tags: body.tags,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : undefined,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    },
    include: { control: true },
  });

  await createAuditLog({
    action: "UPDATE",
    entityType: "document",
    entityId: id,
    userId,
    documentId: id,
    details: `แก้ไขเอกสาร: ${document.title} (สถานะ: ${body.status || document.status})`,
  });

  return NextResponse.json(document);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as { id?: string; role?: string };
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.auditLog.deleteMany({ where: { documentId: id } });
  await prisma.document.delete({ where: { id } });

  await createAuditLog({
    action: "DELETE",
    entityType: "document",
    entityId: id,
    userId: user.id!,
    details: `ลบเอกสาร: ${document.title}`,
  });

  return NextResponse.json({ success: true });
}
