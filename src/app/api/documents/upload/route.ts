import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const maxDuration = 60;

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain",
};

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const controlId = formData.get("controlId") as string;
    const version = (formData.get("version") as string) || "1.0";
    const tags = formData.get("tags") as string;
    const reviewDate = formData.get("reviewDate") as string;
    const expiryDate = formData.get("expiryDate") as string;

    if (!file || !title || !controlId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify controlId exists
    const control = await prisma.iSOControl.findUnique({ where: { id: controlId } });
    if (!control) {
      return NextResponse.json({ error: `ไม่พบ ISO Control (id: ${controlId}) กรุณาเลือกใหม่`, detail: `controlId "${controlId}" not found` }, { status: 400 });
    }

    const uploadDir = process.env.UPLOAD_DIR
      ? path.join(process.env.UPLOAD_DIR, "uploads")
      : path.join(process.cwd(), "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(file.name).toLowerCase();
    const safeFileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadDir, safeFileName);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const userId = (session.user as { id?: string }).id!;
    // Some browsers send empty MIME type for Office files — infer from extension
    const fileType = file.type || MIME_MAP[ext] || "application/octet-stream";

    const document = await prisma.document.create({
      data: {
        title,
        description,
        fileName: file.name,
        fileSize: file.size,
        fileType,
        filePath: `/uploads/${safeFileName}`,
        version,
        controlId,
        uploadedBy: userId,
        tags,
        reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        status: "draft",
      },
      include: { control: true },
    });

    await createAuditLog({
      action: "CREATE",
      entityType: "document",
      entityId: document.id,
      userId,
      documentId: document.id,
      details: `อัปโหลดเอกสาร: ${title}`,
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Upload error:", msg);
    return NextResponse.json({ error: "Upload failed", detail: msg }, { status: 500 });
  }
}
