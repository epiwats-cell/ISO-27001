import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import mammoth from "mammoth";

const getUploadDir = () =>
  process.env.UPLOAD_DIR
    ? path.join(process.env.UPLOAD_DIR, "uploads")
    : path.join(process.cwd(), "uploads");

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const filename = path.basename(doc.filePath);
  const filePath = path.join(getUploadDir(), filename);

  try {
    const buffer = await readFile(filePath);
    const result = await mammoth.convertToHtml({ buffer });
    return NextResponse.json({ html: result.value, messages: result.messages });
  } catch {
    return NextResponse.json({ error: "Cannot read file" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { html } = await request.json();

  // Dynamically import html-to-docx (ESM module)
  const HtmlToDocx = (await import("html-to-docx")).default;

  const filename = path.basename(doc.filePath);
  const filePath = path.join(getUploadDir(), filename);

  try {
    const docxBuffer = await HtmlToDocx(html, null, {
      table: { row: { cantSplit: true } },
      footer: false,
      pageNumber: false,
    });

    await writeFile(filePath, Buffer.from(docxBuffer as ArrayBuffer));

    await prisma.auditLog.create({
      data: {
        action: "update_content",
        entityType: "document",
        entityId: doc.id,
        details: `แก้ไขเนื้อหาเอกสาร "${doc.title}"`,
        userId: (session.user as { id: string }).id,
        documentId: doc.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Cannot save file" }, { status: 500 });
  }
}
