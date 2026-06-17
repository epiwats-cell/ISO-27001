import { cn, statusConfig } from "@/lib/utils";

type Status = keyof typeof statusConfig;

export default function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as Status] ?? { label: status, color: "bg-gray-100 text-gray-600 border-gray-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", config.color)}>
      {config.label}
    </span>
  );
}
