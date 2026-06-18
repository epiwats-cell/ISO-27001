import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename } = params;
  const safeFilename = path.basename(filename);

  const uploadDir = process.env.UPLOAD_DIR
    ? path.join(process.env.UPLOAD_DIR, "uploads")
    : path.join(process.cwd(), "uploads");

  const filePath = path.join(uploadDir, safeFilename);

  try {
    const file = await readFile(filePath);
    const ext = path.extname(safeFilename).toLowerCase();
    const contentTypes: Record<string, string> = {
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
    const contentType = contentTypes[ext] || "application/octet-stream";

    // PDF และรูปภาพให้แสดงใน browser ได้เลย (inline) ที่เหลือให้ download
    const inlineTypes = ["application/pdf", "image/png", "image/jpeg", "text/plain"];
    const disposition = inlineTypes.includes(contentType)
      ? `inline; filename="${safeFilename}"`
      : `attachment; filename="${safeFilename}"`;

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
