import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const statusConfig = {
  draft: { label: "ร่าง", color: "bg-gray-100 text-gray-700 border-gray-200" },
  review: { label: "รอตรวจสอบ", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  approved: { label: "อนุมัติแล้ว", color: "bg-green-100 text-green-700 border-green-200" },
  obsolete: { label: "ยกเลิก", color: "bg-red-100 text-red-700 border-red-200" },
} as const;

export const roleConfig = {
  admin: { label: "ผู้ดูแลระบบ", color: "bg-purple-100 text-purple-700" },
  user: { label: "ผู้ใช้งาน", color: "bg-blue-100 text-blue-700" },
  viewer: { label: "ผู้ดูข้อมูล", color: "bg-gray-100 text-gray-700" },
} as const;

export function getFileIcon(fileType: string): string {
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("word") || fileType.includes("document")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  if (fileType.includes("presentation") || fileType.includes("powerpoint")) return "📑";
  if (fileType.includes("image")) return "🖼️";
  if (fileType.includes("zip") || fileType.includes("compressed")) return "🗜️";
  return "📁";
}
