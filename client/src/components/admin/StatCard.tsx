import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
}: StatCardProps) {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cobalt-50">
          <Icon className="h-5 w-5 text-cobalt-600" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5 text-mint-500" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 text-red-500" />
          )}
          <span className={isPositive ? "text-mint-500" : "text-red-500"}>
            {isPositive ? "+" : ""}
            {trend}%
          </span>
          {trendLabel && <span className="text-slate-400">{trendLabel}</span>}
        </div>
      )}
      {trend === undefined && trendLabel && (
        <p className="mt-3 text-xs text-slate-400">{trendLabel}</p>
      )}
    </div>
  );
}
