"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import DocumentCard from "@/components/DocumentCard";
import { Document } from "@/types";
import { Search, FileSearch } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Document[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.documents || []);
    setSearched(true);
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  return (
    <div>
      <Header title="ค้นหาเอกสาร" />
      <div className="p-6 max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาด้วยชื่อเอกสาร, รายละเอียด, หรือแท็ก..."
              className="w-full pl-12 pr-32 py-4 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              ค้นหา
            </button>
          </div>
        </form>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}

        {!loading && searched && (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {results.length > 0
                ? `พบ ${results.length} เอกสารสำหรับ "${query}"`
                : `ไม่พบเอกสารสำหรับ "${query}"`}
            </p>
            {results.length === 0 ? (
              <div className="text-center py-12">
                <FileSearch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">ไม่พบผลการค้นหา</p>
                <p className="text-gray-400 text-sm mt-1">ลองใช้คำค้นหาอื่น</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((doc) => <DocumentCard key={doc.id} doc={doc} />)}
              </div>
            )}
          </>
        )}

        {!searched && !loading && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">พิมพ์คำค้นหาแล้วกด Enter</p>
          </div>
        )}
      </div>
    </div>
  );
}
