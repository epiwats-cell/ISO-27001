import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export const runtime = "nodejs";

interface OcrLine {
  text: string;
  confidence: number;
}

interface OcrResult {
  fileName: string;
  fileSize: number;
  fullText: string;
  confidence: number;
  lines: OcrLine[];
  wordCount: number;
}

export async function POST(request: NextRequest) {
  try {
    const { results }: { results: OcrResult[] } = await request.json();

    if (!results || results.length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลสำหรับ export" }, { status: 400 });
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ISO 27001 OCR System";
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet("สรุปผลลัพธ์", {
      views: [{ showGridLines: true }],
    });

    summarySheet.columns = [
      { header: "ลำดับ", key: "no", width: 10 },
      { header: "ชื่อไฟล์", key: "fileName", width: 35 },
      { header: "ขนาดไฟล์ (KB)", key: "fileSize", width: 18 },
      { header: "ความแม่นยำ (%)", key: "confidence", width: 18 },
      { header: "จำนวนคำ", key: "wordCount", width: 14 },
      { header: "จำนวนบรรทัด", key: "lineCount", width: 16 },
      { header: "วันที่ประมวลผล", key: "processedAt", width: 22 },
    ];

    // Style header row
    const headerRow = summarySheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a3a5c" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });
    headerRow.height = 30;

    results.forEach((result, index) => {
      const row = summarySheet.addRow({
        no: index + 1,
        fileName: result.fileName,
        fileSize: Math.round(result.fileSize / 1024),
        confidence: result.confidence,
        wordCount: result.wordCount,
        lineCount: result.lines.length,
        processedAt: new Date().toLocaleString("th-TH"),
      });

      row.eachCell((cell) => {
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFD0D5DD" } },
          left: { style: "thin", color: { argb: "FFD0D5DD" } },
          bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
          right: { style: "thin", color: { argb: "FFD0D5DD" } },
        };
        if (index % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
        }
      });

      // Color confidence cell
      const confidenceCell = row.getCell("confidence");
      const conf = result.confidence;
      if (conf >= 80) {
        confidenceCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
        confidenceCell.font = { color: { argb: "FF065F46" }, bold: true };
      } else if (conf >= 60) {
        confidenceCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
        confidenceCell.font = { color: { argb: "FF92400E" }, bold: true };
      } else {
        confidenceCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        confidenceCell.font = { color: { argb: "FF991B1B" }, bold: true };
      }
    });

    // Detail sheets per file
    results.forEach((result, index) => {
      const sheetName = `ไฟล์ ${index + 1}`.substring(0, 31);
      const detailSheet = workbook.addWorksheet(sheetName);

      // File info header
      const infoRows = [
        ["ชื่อไฟล์:", result.fileName],
        ["ขนาดไฟล์:", `${Math.round(result.fileSize / 1024)} KB`],
        ["ความแม่นยำ:", `${result.confidence}%`],
        ["จำนวนคำทั้งหมด:", result.wordCount],
        ["วันที่ประมวลผล:", new Date().toLocaleString("th-TH")],
      ];

      infoRows.forEach(([label, value]) => {
        const row = detailSheet.addRow([label, value]);
        row.getCell(1).font = { bold: true, color: { argb: "FF1a3a5c" } };
        row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F0FE" } };
        row.getCell(2).alignment = { wrapText: true };
      });

      detailSheet.addRow([]);

      // Full text section
      const fullTextLabelRow = detailSheet.addRow(["ข้อความทั้งหมด:"]);
      fullTextLabelRow.getCell(1).font = { bold: true, size: 12, color: { argb: "FF1a3a5c" } };

      const fullTextRow = detailSheet.addRow([result.fullText]);
      fullTextRow.getCell(1).alignment = { wrapText: true, vertical: "top" };
      fullTextRow.height = Math.min(400, Math.max(60, result.lines.length * 15));
      detailSheet.mergeCells(`A${fullTextRow.number}:B${fullTextRow.number}`);

      detailSheet.addRow([]);

      // Line-by-line table
      const lineHeaderRow = detailSheet.addRow(["บรรทัดที่", "ข้อความ", "ความแม่นยำ (%)"]);
      lineHeaderRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1a3a5c" } };
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
      lineHeaderRow.height = 25;

      result.lines.forEach((line, i) => {
        const lineRow = detailSheet.addRow([i + 1, line.text, line.confidence]);
        lineRow.getCell(1).alignment = { horizontal: "center" };
        lineRow.getCell(2).alignment = { wrapText: true };
        lineRow.getCell(3).alignment = { horizontal: "center" };
        lineRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFD0D5DD" } },
            left: { style: "thin", color: { argb: "FFD0D5DD" } },
            bottom: { style: "thin", color: { argb: "FFD0D5DD" } },
            right: { style: "thin", color: { argb: "FFD0D5DD" } },
          };
          if (i % 2 === 1) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8FAFC" } };
          }
        });
      });

      detailSheet.getColumn(1).width = 12;
      detailSheet.getColumn(2).width = 60;
      detailSheet.getColumn(3).width = 18;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="ocr-results-${Date.now()}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Excel export error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างไฟล์ Excel" }, { status: 500 });
  }
}
