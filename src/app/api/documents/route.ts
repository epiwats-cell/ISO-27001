import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const controlCode = searchParams.get("control");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (controlCode) {
    const control = await prisma.iSOControl.findUnique({ where: { code: controlCode } });
    if (control) where.controlId = control.id;
  }
  if (status) where.status = status;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        control: true,
        uploader: { select: { name: true, email: true } },
      },
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({ documents, total, page, limit });
}
