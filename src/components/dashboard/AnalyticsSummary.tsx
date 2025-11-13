import { Users, Globe, MousePointer, ShoppingBag, Receipt } from 'lucide-react';
import { MetricStat } from '../ui/MetricStat';
import { DashboardMetrics } from '../../hooks/useDashboardData';

interface AnalyticsSummaryProps {
  metrics: DashboardMetrics;
  period: string;
  onViewAll?: () => void;
}

export function AnalyticsSummary({ metrics, period, onViewAll }: AnalyticsSummaryProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className="bg-card rounded-lg p-6 card-shadow" data-testid="card-analytics">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-h3 text-foreground font-semibold">Analytics</h2>
      </div>
      <p className="text-caption text-muted-foreground mb-4">Last {period}</p>

      <div className="divide-y divide-border">
        <MetricStat
          icon={Users}
          label="New followers"
          value={formatNumber(metrics.newFollowers)}
          trend={metrics.trends.followers}
        />
        <MetricStat
          icon={Globe}
          label="Total visits"
          value={formatNumber(metrics.totalVisits)}
          trend={metrics.trends.visits}
        />
        <MetricStat
          icon={MousePointer}
          label="Product clicks"
          value={formatNumber(metrics.productClicks)}
          trend={metrics.trends.productClicks}
        />
        <MetricStat
          icon={ShoppingBag}
          label="Items sold"
          value={formatNumber(metrics.itemsSold)}
          trend={metrics.trends.itemsSold}
        />
        <MetricStat
          icon={Receipt}
          label="Total sales"
          value={`$${formatNumber(metrics.totalSales)}`}
          trend={metrics.trends.sales}
          className="pb-0"
        />
      </div>

      {onViewAll && (
        <button
          onClick={onViewAll}
          className="w-full mt-6 py-3 text-body font-medium text-foreground border border-border rounded-lg hover-elevate active-elevate-2"
          data-testid="button-view-all-analytics"
        >
          View all analytics
        </button>
      )}
    </div>
  );
}
