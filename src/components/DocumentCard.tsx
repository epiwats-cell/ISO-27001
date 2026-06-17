import Link from "next/link";
import { formatDate, formatFileSize, getFileIcon } from "@/lib/utils";
import StatusBadge from "./StatusBadge";
import { Document } from "@/types";
import { Calendar, HardDrive, User } from "lucide-react";

export default function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Link href={`/documents/${doc.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
        <div className="flex items-start gap-3">
          <div className="text-2xl mt-0.5">{getFileIcon(doc.fileType)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 truncate">{doc.title}</h3>
              <StatusBadge status={doc.status} />
            </div>
            {doc.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{doc.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(doc.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                {formatFileSize(doc.fileSize)}
              </span>
              {doc.uploader && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {doc.uploader.name}
                </span>
              )}
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">
                v{doc.version}
              </span>
            </div>
            {doc.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {doc.tags.split(",").map((tag) => (
                  <span key={tag} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
