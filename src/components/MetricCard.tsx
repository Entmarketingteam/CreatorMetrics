import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
}

export default function MetricCard({ title, value, change, changeLabel, icon }: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    if (change > 0) return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
    if (change < 0) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {change !== undefined && (
            <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-full text-sm font-medium ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{changeLabel || `${change > 0 ? '+' : ''}${change}%`}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
