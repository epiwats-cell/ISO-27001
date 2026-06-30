import { NextRequest, NextResponse } from "next/server";
import { createWorker, PSM } from "tesseract.js";
import type { Rectangle } from "tesseract.js";

export const runtime = "nodejs";
export const maxDuration = 60;

interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
  // original image dimensions for scaling
  imageWidth: number;
  imageHeight: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const regionsRaw = formData.get("regions") as string | null;

    // regions: array of RegionSelection per file (optional)
    let regions: (RegionSelection | null)[] = [];
    if (regionsRaw) {
      try {
        regions = JSON.parse(regionsRaw);
      } catch {
        regions = [];
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่อัปโหลด" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `ไฟล์ ${file.name} ไม่รองรับ กรุณาใช้ไฟล์ภาพ (JPG, PNG, WEBP, BMP, TIFF)` },
          { status: 400 }
        );
      }
    }

    // Use both Thai and English; enable legacy engine for better Thai handwriting
    const worker = await createWorker(["tha", "eng"], 1, {
      logger: () => {},
    });

    // Improve Thai handwriting recognition settings
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
    });

    const results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const region = regions[i] || null;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      let rectangle: Rectangle | undefined;
      if (region) {
        rectangle = {
          left: Math.round(region.x),
          top: Math.round(region.y),
          width: Math.round(region.width),
          height: Math.round(region.height),
        };
      }

      const { data } = await worker.recognize(buffer, { rectangle });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageData = data as any;
      const lines = (pageData.lines || []).map((line: { text: string; confidence: number; words: { text: string }[] }) => ({
        text: line.text.trim(),
        confidence: Math.round(line.confidence),
        words: line.words.map((w: { text: string }) => w.text).join(" "),
      }));

      results.push({
        fileName: file.name,
        fileSize: file.size,
        fullText: data.text.trim(),
        confidence: Math.round(data.confidence),
        lines: lines.filter((l: { text: string }) => l.text.length > 0),
        wordCount: (pageData.words || []).length,
        hasRegion: !!region,
        region: region || null,
      });
    }

    await worker.terminate();

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("OCR error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการประมวลผล OCR" }, { status: 500 });
  }
}
