"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Building2,
  Users,
  Package,
  Lock,
  Key,
  MapPin,
  Settings2,
  Network,
  Code2,
  Truck,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Search,
  Upload,
  UserCog,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";

const isoModules = [
  { code: "A.5", nameTh: "นโยบายความมั่นคงปลอดภัย", icon: Shield },
  { code: "A.6", nameTh: "การจัดองค์กรด้านความมั่นคงฯ", icon: Building2 },
  { code: "A.7", nameTh: "ความมั่นคงด้านทรัพยากรบุคคล", icon: Users },
  { code: "A.8", nameTh: "การจัดการทรัพย์สิน", icon: Package },
  { code: "A.9", nameTh: "การควบคุมการเข้าถึง", icon: Lock },
  { code: "A.10", nameTh: "การเข้ารหัส", icon: Key },
  { code: "A.11", nameTh: "ความมั่นคงปลอดภัยทางกายภาพ", icon: MapPin },
  { code: "A.12", nameTh: "ความมั่นคงในการดำเนินงาน", icon: Settings2 },
  { code: "A.13", nameTh: "ความมั่นคงในการสื่อสาร", icon: Network },
  { code: "A.14", nameTh: "การได้มาและพัฒนาระบบ", icon: Code2 },
  { code: "A.15", nameTh: "ความสัมพันธ์กับผู้ส่งมอบ", icon: Truck },
  { code: "A.16", nameTh: "การจัดการเหตุการณ์", icon: AlertTriangle },
  { code: "A.17", nameTh: "ความต่อเนื่องทางธุรกิจ", icon: RefreshCw },
  { code: "A.18", nameTh: "การปฏิบัติตามกฎระเบียบ", icon: FileCheck },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isoExpanded, setIsoExpanded] = useState(true);
  const user = session?.user as { role?: string } | undefined;
  const isAdmin = user?.role === "admin";

  return (
    <aside className="w-64 min-h-screen bg-[#1a3a5c] text-white flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-400 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm leading-tight">ISO 27001</div>
            <div className="text-xs text-blue-300">Document Management</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Main menu */}
        <NavItem href="/dashboard" icon={LayoutDashboard} label="แดชบอร์ด" pathname={pathname} />
        <NavItem href="/documents/upload" icon={Upload} label="อัปโหลดเอกสาร" pathname={pathname} />
        <NavItem href="/search" icon={Search} label="ค้นหาเอกสาร" pathname={pathname} />

        {/* ISO 27001 Controls */}
        <div className="pt-2">
          <button
            onClick={() => setIsoExpanded(!isoExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-blue-300 uppercase tracking-wider hover:text-white transition-colors"
          >
            <span>ISO 27001 Controls</span>
            {isoExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>

          {isoExpanded && (
            <div className="space-y-0.5 mt-1">
              {isoModules.map((mod) => {
                const Icon = mod.icon;
                const href = `/controls/${mod.code}`;
                const isActive = pathname === href;
                return (
                  <Link
                    key={mod.code}
                    href={href}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all group",
                      isActive
                        ? "bg-blue-500 text-white"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1 leading-tight">{mod.nameTh}</span>
                    <span className={cn(
                      "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded",
                      isActive ? "bg-white/20 text-white" : "bg-white/10 text-blue-300"
                    )}>
                      {mod.code}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Admin section */}
        {isAdmin && (
          <div className="pt-2">
            <div className="px-3 py-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
              ผู้ดูแลระบบ
            </div>
            <div className="space-y-0.5">
              <NavItem href="/admin/users" icon={UserCog} label="จัดการผู้ใช้งาน" pathname={pathname} />
              <NavItem href="/admin/audit" icon={ClipboardList} label="บันทึกการใช้งาน" pathname={pathname} />
            </div>
          </div>
        )}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-white/10">
        <div className="text-xs text-blue-300">
          <div className="font-medium text-white truncate">{session?.user?.name}</div>
          <div className="truncate">{session?.user?.email}</div>
          <div className="mt-1 capitalize bg-white/10 inline-block px-2 py-0.5 rounded text-[10px]">
            {user?.role === "admin" ? "ผู้ดูแลระบบ" : user?.role === "viewer" ? "ผู้ดูข้อมูล" : "ผู้ใช้งาน"}
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  pathname,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
        isActive
          ? "bg-blue-500 text-white"
          : "text-blue-100 hover:bg-white/10 hover:text-white"
      )}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
