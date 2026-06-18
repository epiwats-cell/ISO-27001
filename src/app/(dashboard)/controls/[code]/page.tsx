"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import DocumentCard from "@/components/DocumentCard";
import { Document, ISOControl } from "@/types";
import { Upload, FileText, Filter } from "lucide-react";
import Link from "next/link";

const statusOptions = [
  { value: "", label: "ทุกสถานะ" },
  { value: "draft", label: "ร่าง" },
  { value: "review", label: "รอตรวจสอบ" },
  { value: "approved", label: "อนุมัติแล้ว" },
  { value: "obsolete", label: "ยกเลิก" },
];

export default function ControlPage({ params }: { params: { code: string } }) {
  const decodedCode = decodeURIComponent(params.code);
  const [control, setControl] = useState<ISOControl | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = new URL("/api/documents", window.location.origin);
    url.searchParams.set("control", decodedCode);
    if (status) url.searchParams.set("status", status);

    Promise.all([
      fetch("/api/controls").then((r) => r.json()),
      fetch(url).then((r) => r.json()),
    ]).then(([controls, data]) => {
      const found = controls.find((c: ISOControl) => c.code === decodedCode);
      setControl(found || null);
      setDocuments(data.documents || []);
      setTotal(data.total || 0);
      setLoading(false);
    });
  }, [decodedCode, status]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <Header title={control ? `${control.code} - ${control.nameTh}` : decodedCode} />
      <div className="p-6">
        {/* Control info */}
        {control && (
          <div className="bg-gradient-to-r from-[#1a3a5c] to-[#1e4d7b] rounded-xl p-5 mb-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-blue-300 text-sm font-mono mb-1">{control.code}</div>
                <h2 className="text-xl font-bold">{control.nameTh}</h2>
                <p className="text-sm text-blue-200 mt-1">{control.name}</p>
                <p className="text-sm text-blue-100 mt-2 max-w-2xl">{control.description}</p>
              </div>
              <Link
                href={`/documents/upload?control=${control.id}`}
                className="bg-white text-[#1a3a5c] hover:bg-blue-50 font-semibold text-sm px-4 py-2 rounded-lg flex items-center gap-2 flex-shrink-0 transition-colors"
              >
                <Upload className="w-4 h-4" />
                อัปโหลดเอกสาร
              </Link>
            </div>
          </div>
        )}

        {/* Filters + count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">พบ <strong>{total}</strong> เอกสาร</span>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Documents grid */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">ยังไม่มีเอกสารใน {decodedCode}</p>
            <p className="text-gray-400 text-sm mt-1">เริ่มต้นด้วยการอัปโหลดเอกสารแรก</p>
            {control && (
              <Link
                href={`/documents/upload?control=${control.id}`}
                className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                อัปโหลดเอกสาร
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
