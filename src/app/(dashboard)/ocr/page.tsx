"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload,
  FileImage,
  X,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  ScanText,
  Info,
  Crop,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  hasRegion: boolean;
}

interface RegionSelection {
  x: number;
  y: number;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
}

interface UploadFile {
  file: File;
  preview: string;
  id: string;
  region: RegionSelection | null;
  naturalWidth: number;
  naturalHeight: number;
}

// Region selector component — lets user draw a rectangle on the image
function RegionSelector({
  src,
  region,
  naturalWidth,
  naturalHeight,
  onChange,
  onClear,
}: {
  src: string;
  region: RegionSelection | null;
  naturalWidth: number;
  naturalHeight: number;
  onChange: (r: RegionSelection) => void;
  onClear: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [current, setCurrent] = useState<{ x: number; y: number } | null>(null);

  const getRelative = (e: React.MouseEvent) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(e.clientX - rect.left, rect.width)),
      y: Math.max(0, Math.min(e.clientY - rect.top, rect.height)),
    };
  };

  const toImageCoords = (displayX: number, displayY: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    return {
      x: Math.round((displayX / rect.width) * naturalWidth),
      y: Math.round((displayY / rect.height) * naturalHeight),
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const pos = getRelative(e);
    setStart(pos);
    setCurrent(pos);
    setDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setCurrent(getRelative(e));
  };

  const onMouseUp = (e: React.MouseEvent) => {
    if (!dragging || !start) return;
    setDragging(false);
    const end = getRelative(e);
    const x1 = Math.min(start.x, end.x);
    const y1 = Math.min(start.y, end.y);
    const x2 = Math.max(start.x, end.x);
    const y2 = Math.max(start.y, end.y);
    if (x2 - x1 < 10 || y2 - y1 < 10) return; // too small
    const imgStart = toImageCoords(x1, y1);
    const imgEnd = toImageCoords(x2, y2);
    onChange({
      x: imgStart.x,
      y: imgStart.y,
      width: imgEnd.x - imgStart.x,
      height: imgEnd.y - imgStart.y,
      imageWidth: naturalWidth,
      imageHeight: naturalHeight,
    });
    setStart(null);
    setCurrent(null);
  };

  // Display rect from region props
  const displayRect = () => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    if (!region) return null;
    return {
      left: (region.x / naturalWidth) * rect.width,
      top: (region.y / naturalHeight) * rect.height,
      width: (region.width / naturalWidth) * rect.width,
      height: (region.height / naturalHeight) * rect.height,
    };
  };

  // Temp rect while dragging
  const tempRect = () => {
    if (!start || !current) return null;
    return {
      left: Math.min(start.x, current.x),
      top: Math.min(start.y, current.y),
      width: Math.abs(current.x - start.x),
      height: Math.abs(current.y - start.y),
    };
  };

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const handler = () => forceUpdate((n) => n + 1);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const dr = displayRect();
  const tr = tempRect();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Crop className="w-3.5 h-3.5" />
        <span>ลากเมาส์บนรูปเพื่อเลือกบริเวณที่ต้องการสแกน (ถ้าไม่เลือกจะสแกนทั้งรูป)</span>
        {region && (
          <button
            onClick={onClear}
            className="ml-auto flex items-center gap-1 text-red-500 hover:text-red-700 font-medium"
          >
            <RotateCcw className="w-3 h-3" />
            ล้างการเลือก
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="relative select-none cursor-crosshair rounded-xl overflow-hidden border-2 border-dashed border-blue-300 bg-gray-100"
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { if (dragging) { setDragging(false); setStart(null); setCurrent(null); } }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="preview"
          className="w-full h-auto pointer-events-none"
          draggable={false}
        />
        {/* Saved region overlay */}
        {dr && !dragging && (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500/10"
            style={{ left: dr.left, top: dr.top, width: dr.width, height: dr.height }}
          >
            <div className="absolute -top-5 left-0 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
              บริเวณที่เลือก
            </div>
          </div>
        )}
        {/* Temp drag rect */}
        {tr && dragging && (
          <div
            className="absolute border-2 border-dashed border-blue-400 bg-blue-400/10 pointer-events-none"
            style={{ left: tr.left, top: tr.top, width: tr.width, height: tr.height }}
          />
        )}
      </div>
      {region && (
        <p className="text-xs text-blue-600">
          เลือกบริเวณ: ({region.x}, {region.y}) ขนาด {region.width}×{region.height} px
        </p>
      )}
    </div>
  );
}

export default function OcrPage() {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [results, setResults] = useState<OcrResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<number>>(new Set());
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/bmp", "image/tiff"];
    const validFiles = Array.from(newFiles).filter((f) => allowed.includes(f.type));

    if (validFiles.length < Array.from(newFiles).length) {
      setError("บางไฟล์ไม่รองรับ รองรับเฉพาะ JPG, PNG, WEBP, BMP, TIFF");
    } else {
      setError(null);
    }

    const mapped: UploadFile[] = validFiles.map((file) => {
      const preview = URL.createObjectURL(file);
      const img = new window.Image();
      img.src = preview;
      return {
        file,
        preview,
        id: `${Date.now()}-${Math.random()}`,
        region: null,
        naturalWidth: 0,
        naturalHeight: 0,
      };
    });

    // Load image dimensions
    mapped.forEach((uf) => {
      const img = new window.Image();
      img.onload = () => {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id
              ? { ...f, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }
              : f
          )
        );
      };
      img.src = uf.preview;
    });

    setUploadFiles((prev) => [...prev, ...mapped]);
  }, []);

  const removeFile = (id: string) => {
    setUploadFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
    if (activeRegionId === id) setActiveRegionId(null);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleOcr = async () => {
    if (uploadFiles.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setResults([]);

    try {
      const formData = new FormData();
      uploadFiles.forEach((uf) => formData.append("files", uf.file));

      const regions = uploadFiles.map((uf) => uf.region);
      formData.append("regions", JSON.stringify(regions));

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "OCR ล้มเหลว");
      setResults(data.results);
      setExpandedResults(new Set(data.results.map((_: OcrResult, i: number) => i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (results.length === 0) return;
    setIsExporting(true);
    try {
      const res = await fetch("/api/ocr/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });

      if (!res.ok) throw new Error("Export ล้มเหลว");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ocr-results-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการ export");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const confidenceColor = (conf: number) => {
    if (conf >= 80) return "text-emerald-600 bg-emerald-50";
    if (conf >= 60) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  const confidenceLabel = (conf: number) => {
    if (conf >= 80) return "สูง";
    if (conf >= 60) return "ปานกลาง";
    return "ต่ำ";
  };

  const filesWithRegion = uploadFiles.filter((f) => f.region).length;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <ScanText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">OCR สแกนเอกสาร</h1>
            <p className="text-sm text-gray-500">แปลงข้อความจากรูปภาพเป็นข้อมูลดิจิทัล และ export เป็น Excel</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <span className="font-semibold">รองรับภาษาไทยและอังกฤษ</span> — อัปโหลดรูปภาพเอกสาร (JPG, PNG, WEBP, BMP, TIFF)
          </p>
          <p>
            <span className="font-semibold">เลือกบริเวณ:</span> สามารถลากเมาส์วาดกรอบบนรูปเพื่อสแกนเฉพาะส่วนที่ต้องการ
          </p>
          <p className="text-blue-500">
            หมายเหตุ: ลายมือภาษาไทยอาจมีความแม่นยำต่ำกว่าตัวพิมพ์ ควรถ่ายรูปให้ชัดและตรง
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all mb-6",
          isDragging
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/bmp,image/tiff"
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
            isDragging ? "bg-blue-100" : "bg-gray-100"
          )}>
            <Upload className={cn("w-7 h-7", isDragging ? "text-blue-500" : "text-gray-400")} />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-700">
              {isDragging ? "วางไฟล์ที่นี่" : "คลิกหรือลากไฟล์มาวางที่นี่"}
            </p>
            <p className="text-sm text-gray-400 mt-1">รองรับ JPG, PNG, WEBP, BMP, TIFF (หลายไฟล์)</p>
          </div>
        </div>
      </div>

      {/* File cards with region selector */}
      {uploadFiles.length > 0 && (
        <div className="mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              ไฟล์ที่เลือก ({uploadFiles.length} ไฟล์)
              {filesWithRegion > 0 && (
                <span className="ml-2 text-blue-600 font-normal">
                  — เลือกบริเวณแล้ว {filesWithRegion} ไฟล์
                </span>
              )}
            </h3>
          </div>

          {uploadFiles.map((uf) => (
            <div key={uf.id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              {/* File header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <FileImage className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{uf.file.name}</p>
                    <p className="text-xs text-gray-400">
                      {Math.round(uf.file.size / 1024)} KB
                      {uf.naturalWidth > 0 && ` • ${uf.naturalWidth}×${uf.naturalHeight} px`}
                      {uf.region && <span className="text-blue-500 ml-1">• มีการเลือกบริเวณ</span>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveRegionId(activeRegionId === uf.id ? null : uf.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      activeRegionId === uf.id
                        ? "bg-blue-100 text-blue-700"
                        : uf.region
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <Crop className="w-3.5 h-3.5" />
                    {uf.region ? "แก้ไขบริเวณ" : "เลือกบริเวณ"}
                  </button>
                  <button
                    onClick={() => removeFile(uf.id)}
                    className="w-7 h-7 bg-red-50 text-red-500 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Region selector (expandable) */}
              {activeRegionId === uf.id && uf.naturalWidth > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <RegionSelector
                    src={uf.preview}
                    region={uf.region}
                    naturalWidth={uf.naturalWidth}
                    naturalHeight={uf.naturalHeight}
                    onChange={(r) => {
                      setUploadFiles((prev) =>
                        prev.map((f) => (f.id === uf.id ? { ...f, region: r } : f))
                      );
                    }}
                    onClear={() => {
                      setUploadFiles((prev) =>
                        prev.map((f) => (f.id === uf.id ? { ...f, region: null } : f))
                      );
                    }}
                  />
                </div>
              )}

              {/* Thumbnail when not editing */}
              {activeRegionId !== uf.id && (
                <div className="p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uf.preview}
                    alt={uf.file.name}
                    className="h-24 w-auto rounded-lg object-contain bg-gray-100 border border-gray-200"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleOcr}
          disabled={uploadFiles.length === 0 || isProcessing}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all",
            uploadFiles.length === 0 || isProcessing
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm"
          )}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              กำลังประมวลผล OCR...
            </>
          ) : (
            <>
              <ScanText className="w-4 h-4" />
              เริ่มสแกน OCR ({uploadFiles.length} ไฟล์)
              {filesWithRegion > 0 && ` — ${filesWithRegion} ไฟล์มีการเลือกบริเวณ`}
            </>
          )}
        </button>

        {results.length > 0 && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                กำลัง Export...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </>
            )}
          </button>
        )}

        {uploadFiles.length > 0 && (
          <button
            onClick={() => { setUploadFiles([]); setResults([]); setError(null); setActiveRegionId(null); }}
            className="flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
          >
            <X className="w-4 h-4" />
            ล้างทั้งหมด
          </button>
        )}
      </div>

      {/* Processing indicator */}
      {isProcessing && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-blue-700 font-semibold text-lg">กำลังวิเคราะห์ข้อความ...</p>
          <p className="text-blue-500 text-sm mt-1">
            กำลังประมวลผล {uploadFiles.length} ไฟล์ อาจใช้เวลา 10-30 วินาที
          </p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              ผลลัพธ์ OCR ({results.length} ไฟล์)
            </h2>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-all disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {isExporting ? "กำลัง Export..." : "Download Excel"}
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                {/* Result header */}
                <button
                  onClick={() => toggleExpand(index)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileImage className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {result.fileName}
                        {result.hasRegion && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-normal">
                            สแกนเฉพาะบริเวณ
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {result.wordCount} คำ • {result.lines.length} บรรทัด •{" "}
                        {Math.round(result.fileSize / 1024)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-semibold px-3 py-1 rounded-full",
                      confidenceColor(result.confidence)
                    )}>
                      ความแม่นยำ {result.confidence}% ({confidenceLabel(result.confidence)})
                    </span>
                    {expandedResults.has(index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded content */}
                {expandedResults.has(index) && (
                  <div className="border-t border-gray-100">
                    {/* Full text */}
                    <div className="p-5 border-b border-gray-100">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">ข้อความทั้งหมด</h4>
                      <div className="bg-gray-50 rounded-xl p-4 max-h-48 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                          {result.fullText || "(ไม่พบข้อความ)"}
                        </pre>
                      </div>
                    </div>

                    {/* Line by line */}
                    {result.lines.length > 0 && (
                      <div className="p-5">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">
                          ข้อความแบบบรรทัดต่อบรรทัด ({result.lines.length} บรรทัด)
                        </h4>
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-16">บรรทัด</th>
                                <th className="px-4 py-3 text-left font-semibold text-gray-600">ข้อความ</th>
                                <th className="px-4 py-3 text-right font-semibold text-gray-600 w-28">ความแม่นยำ</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {result.lines.map((line, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                  <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{i + 1}</td>
                                  <td className="px-4 py-2.5 text-gray-800">{line.text}</td>
                                  <td className="px-4 py-2.5 text-right">
                                    <span className={cn(
                                      "text-xs font-medium px-2 py-0.5 rounded-full",
                                      confidenceColor(line.confidence)
                                    )}>
                                      {line.confidence}%
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
