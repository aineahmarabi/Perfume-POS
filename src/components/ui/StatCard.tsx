import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: { value: number; label: string };
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, icon, className }: StatCardProps) {
  return (
    <div className={cn("bg-white border border-[#E0E0E0] rounded-md p-5", className)}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B]">{title}</p>
        {icon && <div className="text-[#9B9B9B]">{icon}</div>}
      </div>
      <p className="text-2xl font-semibold font-mono tabular-nums text-[#6B1A2A]">{value}</p>
      {subtitle && <p className="text-sm text-[#9B9B9B] mt-1">{subtitle}</p>}
      {trend && (
        <div className={cn("flex items-center gap-1 mt-2 text-sm font-medium", trend.value >= 0 ? "text-[#16A34A]" : "text-[#DC2626]")}>
          {trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend.value >= 0 ? "+" : ""}{trend.value.toFixed(1)}%</span>
          <span className="text-[#9B9B9B] font-normal">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
