"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatDateTime, formatFileSize, getFileIcon } from "@/lib/utils";
import { Document } from "@/types";
import {
  Download, Pencil, Trash2, ArrowLeft, Calendar, HardDrive,
  User, Tag, Clock, CheckCircle, AlertCircle, XCircle, FileText,
} from "lucide-react";
import Link from "next/link";

const statusTransitions: Record<string, string[]> = {
  draft: ["review"],
  review: ["approved", "draft"],
  approved: ["obsolete"],
  obsolete: [],
};

const nextStatusLabel: Record<string, string> = {
  review: "ส่งตรวจสอบ",
  approved: "อนุมัติ",
  draft: "ส่งกลับแก้ไข",
  obsolete: "ยกเลิก",
};

const nextStatusIcon: Record<string, React.ReactNode> = {
  review: <Clock className="w-4 h-4" />,
  approved: <CheckCircle className="w-4 h-4" />,
  draft: <AlertCircle className="w-4 h-4" />,
  obsolete: <XCircle className="w-4 h-4" />,
};

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const [doc, setDoc] = useState<Document & { auditLogs?: { id: string; action: string; details: string; createdAt: string; user: { name: string } }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", version: "", tags: "" });
  const [saving, setSaving] = useState(false);
  const user = session?.user as { role?: string; id?: string } | undefined;

  useEffect(() => {
    fetch(`/api/documents/${id}`)
      .then((r) => r.json())
      .then((d) => { setDoc(d); setEditForm({ title: d.title, description: d.description || "", version: d.version, tags: d.tags || "" }); setLoading(false); });
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }) });
    if (res.ok) { const updated = await res.json(); setDoc((prev) => prev ? { ...prev, ...updated } : null); }
  };

  const saveEdit = async () => {
    setSaving(true);
    const res = await fetch(`/api/documents/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    if (res.ok) { const updated = await res.json(); setDoc((prev) => prev ? { ...prev, ...updated } : null); setEditing(false); }
    setSaving(false);
  };

  const deleteDoc = async () => {
    if (!confirm("ต้องการลบเอกสารนี้หรือไม่?")) return;
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!doc) return <div className="p-6 text-center text-gray-500">ไม่พบเอกสาร</div>;

  const canEdit = user?.role === "admin" || user?.id === doc.uploadedBy;
  const transitions = statusTransitions[doc.status] || [];

  return (
    <div>
      <Header />
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back link */}
        <Link href={`/controls/${doc.control?.code}`} className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> กลับไป {doc.control?.code}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getFileIcon(doc.fileType)}</span>
                  <div>
                    {editing ? (
                      <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="text-xl font-bold text-gray-800 border-b-2 border-blue-500 focus:outline-none w-full" />
                    ) : (
                      <h1 className="text-xl font-bold text-gray-800">{doc.title}</h1>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={doc.status} />
                      <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">v{doc.version}</span>
                      {doc.control && (
                        <Link href={`/controls/${doc.control.code}`} className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100">
                          {doc.control.code}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && !editing && (
                  <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-3">
                  <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="รายละเอียด..." rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <input value={editForm.version} onChange={(e) => setEditForm({ ...editForm, version: e.target.value })} placeholder="เวอร์ชัน" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <input value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} placeholder="แท็ก (คั่นด้วยจุลภาค)" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex gap-2">
                    <button onClick={saveEdit} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">{saving ? "บันทึก..." : "บันทึก"}</button>
                    <button onClick={() => setEditing(false)} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
                  </div>
                </div>
              ) : (
                doc.description && <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
              )}

              {doc.tags && !editing && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  <Tag className="w-3.5 h-3.5 text-gray-400 mt-0.5" />
                  {doc.tags.split(",").map((tag) => (
                    <span key={tag} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{tag.trim()}</span>
                  ))}
                </div>
              )}

              {/* Status actions */}
              {canEdit && transitions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                  {transitions.map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(s)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        s === "approved" ? "bg-green-100 text-green-700 hover:bg-green-200" :
                        s === "obsolete" ? "bg-red-100 text-red-700 hover:bg-red-200" :
                        s === "review" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" :
                        "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {nextStatusIcon[s]}
                      {nextStatusLabel[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Audit log */}
            {doc.auditLogs && doc.auditLogs.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  ประวัติการเปลี่ยนแปลง
                </h3>
                <div className="space-y-2">
                  {doc.auditLogs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <span className="text-gray-700">{log.details}</span>
                        <span className="text-gray-400 text-xs ml-2">โดย {log.user?.name} • {formatDateTime(log.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar info */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                ข้อมูลไฟล์
              </h3>
              <InfoRow icon={<HardDrive className="w-4 h-4" />} label="ขนาดไฟล์" value={formatFileSize(doc.fileSize)} />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="ชื่อไฟล์" value={doc.fileName} />
              <InfoRow icon={<User className="w-4 h-4" />} label="อัปโหลดโดย" value={(doc.uploader as { name?: string })?.name || "-"} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="วันที่อัปโหลด" value={formatDate(doc.createdAt)} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="แก้ไขล่าสุด" value={formatDate(doc.updatedAt)} />
              {doc.reviewDate && <InfoRow icon={<Clock className="w-4 h-4" />} label="วันทบทวน" value={formatDate(doc.reviewDate)} />}
              {doc.expiryDate && <InfoRow icon={<AlertCircle className="w-4 h-4" />} label="วันหมดอายุ" value={formatDate(doc.expiryDate)} />}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <a
                href={`/api/files/${doc.filePath.split("/").pop()}`}
                download={doc.fileName}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                ดาวน์โหลดเอกสาร
              </a>
              {user?.role === "admin" && (
                <button
                  onClick={deleteDoc}
                  className="w-full flex items-center justify-center gap-2 border border-red-300 text-red-600 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบเอกสาร
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="text-gray-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <div className="text-gray-500 text-xs">{label}</div>
        <div className="text-gray-700 break-all">{value}</div>
      </div>
    </div>
  );
}
