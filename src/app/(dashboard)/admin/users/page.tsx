"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { User } from "@/types";
import { roleConfig, formatDate } from "@/lib/utils";
import { UserPlus, Trash2, Pencil, X, Check, Users } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", name: "", password: "", role: "user", department: "" });
  const [editForm, setEditForm] = useState({ name: "", role: "user", department: "" });

  const loadUsers = () => {
    fetch("/api/admin/users").then((r) => r.json()).then((d) => { setUsers(d); setLoading(false); });
  };

  useEffect(loadUsers, []);

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) { setShowAdd(false); setForm({ email: "", name: "", password: "", role: "user", department: "" }); loadUsers(); }
  };

  const updateUser = async (id: string) => {
    await fetch(`/api/admin/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
    setEditId(null);
    loadUsers();
  };

  const deleteUser = async (id: string) => {
    if (!confirm("ต้องการลบผู้ใช้นี้หรือไม่?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <Header title="จัดการผู้ใช้งาน" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            <span>ผู้ใช้งานทั้งหมด {users.length} คน</span>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            เพิ่มผู้ใช้งาน
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
            <h3 className="font-semibold text-gray-800 mb-4">เพิ่มผู้ใช้งานใหม่</h3>
            <form onSubmit={addUser} className="grid grid-cols-2 gap-3">
              <input required type="email" placeholder="อีเมล *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required placeholder="ชื่อ-นามสกุล *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="password" placeholder="รหัสผ่าน *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input placeholder="แผนก" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="user">ผู้ใช้งาน</option>
                <option value="admin">ผู้ดูแลระบบ</option>
                <option value="viewer">ผู้ดูข้อมูล</option>
              </select>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700">บันทึก</button>
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm hover:bg-gray-50">ยกเลิก</button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ชื่อ-อีเมล</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">แผนก</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">สิทธิ์</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">เอกสาร</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">วันที่สร้าง</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="px-2 py-1 border border-gray-300 rounded text-sm w-full" />
                    ) : (
                      <>
                        <div className="font-medium text-gray-800">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {editId === u.id ? (
                      <input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} className="px-2 py-1 border border-gray-300 rounded text-sm w-full" />
                    ) : u.department || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })} className="px-2 py-1 border border-gray-300 rounded text-sm">
                        <option value="user">ผู้ใช้งาน</option>
                        <option value="admin">ผู้ดูแลระบบ</option>
                        <option value="viewer">ผู้ดูข้อมูล</option>
                      </select>
                    ) : (
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${roleConfig[u.role as keyof typeof roleConfig]?.color}`}>
                        {roleConfig[u.role as keyof typeof roleConfig]?.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u._count?.documents ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      {editId === u.id ? (
                        <>
                          <button onClick={() => updateUser(u.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditId(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => { setEditId(u.id); setEditForm({ name: u.name, role: u.role, department: u.department || "" }); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteUser(u.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
