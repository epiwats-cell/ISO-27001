"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import StatusBadge from "@/components/StatusBadge";
import { formatDate, formatFileSize, getFileIcon } from "@/lib/utils";
import { DashboardStats } from "@/types";
import {
  FileText,
  CheckCircle,
  Clock,
  Edit3,
  XCircle,
  Shield,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statCards = [
    { label: "เอกสารทั้งหมด", value: stats?.totalDocuments ?? 0, icon: FileText, color: "bg-blue-500", bg: "bg-blue-50" },
    { label: "อนุมัติแล้ว", value: stats?.approvedDocuments ?? 0, icon: CheckCircle, color: "bg-green-500", bg: "bg-green-50" },
    { label: "รอตรวจสอบ", value: stats?.pendingReview ?? 0, icon: Clock, color: "bg-yellow-500", bg: "bg-yellow-50" },
    { label: "ร่าง", value: stats?.draftDocuments ?? 0, icon: Edit3, color: "bg-gray-500", bg: "bg-gray-50" },
    { label: "ยกเลิกแล้ว", value: stats?.obsoleteDocuments ?? 0, icon: XCircle, color: "bg-red-500", bg: "bg-red-50" },
    { label: "Controls ที่มีเอกสาร", value: `${stats?.controlsWithDocuments ?? 0}/${stats?.totalControls ?? 14}`, icon: Shield, color: "bg-purple-500", bg: "bg-purple-50" },
  ];

  const complianceRate = stats?.totalControls
    ? Math.round(((stats.controlsWithDocuments ?? 0) / stats.totalControls) * 100)
    : 0;

  return (
    <div>
      <Header title="แดชบอร์ด" />
      <div className="p-6 space-y-6">

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-white`}>
                <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-4.5 h-4.5 text-white" size={18} />
                </div>
                <div className="text-2xl font-bold text-gray-800">{card.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{card.label}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent documents */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                เอกสารล่าสุด
              </h2>
              <Link href="/search" className="text-xs text-blue-600 hover:text-blue-800">ดูทั้งหมด →</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {stats?.recentDocuments.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">ยังไม่มีเอกสาร</div>
              )}
              {stats?.recentDocuments.map((doc) => (
                <Link key={doc.id} href={`/documents/${doc.id}`}>
                  <div className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-3">
                    <span className="text-xl">{getFileIcon(doc.fileType)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{doc.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {(doc.control as { code?: string; nameTh?: string })?.code} • {formatDate(doc.createdAt)} • {formatFileSize(doc.fileSize)}
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Compliance + controls chart */}
          <div className="space-y-4">
            {/* Compliance rate */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-green-600" />
                อัตราความครอบคลุม
              </h2>
              <div className="flex items-center justify-center">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                    <circle
                      cx="60" cy="60" r="50" fill="none"
                      stroke={complianceRate >= 80 ? "#22c55e" : complianceRate >= 50 ? "#eab308" : "#ef4444"}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 50}`}
                      strokeDashoffset={`${2 * Math.PI * 50 * (1 - complianceRate / 100)}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-800">{complianceRate}%</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">
                {stats?.controlsWithDocuments} จาก {stats?.totalControls} controls มีเอกสาร
              </p>
            </div>

            {/* Controls overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                เอกสารแต่ละ Control
              </h2>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {stats?.documentsByControl.map((c) => (
                  <Link key={c.code} href={`/controls/${c.code}`}>
                    <div className="flex items-center gap-2 py-1 hover:bg-gray-50 rounded px-1 transition-colors">
                      <span className="text-xs font-mono text-blue-600 w-8 flex-shrink-0">{c.code}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min((c.count / Math.max(...(stats.documentsByControl.map(x => x.count)), 1)) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-4 text-right">{c.count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
