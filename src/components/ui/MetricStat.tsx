import { LucideIcon } from 'lucide-react';
import { TrendBadge } from './TrendBadge';

interface MetricStatProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: number;
  className?: string;
}

export function MetricStat({ icon: Icon, label, value, trend, className = '' }: MetricStatProps) {
  return (
    <div className={`flex items-center justify-between py-3 ${className}`} data-testid={`metric-${label.toLowerCase().replace(/\s+/g, '-')}`}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="text-body text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-body font-semibold text-foreground">{value}</span>
        {trend !== undefined && <TrendBadge value={trend} />}
      </div>
    </div>
  );
}
