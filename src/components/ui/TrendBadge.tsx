import { TrendingUp, TrendingDown } from 'lucide-react';

interface TrendBadgeProps {
  value: number;
  showIcon?: boolean;
}

export function TrendBadge({ value, showIcon = false }: TrendBadgeProps) {
  const isPositive = value >= 0;
  const displayValue = `${isPositive ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-caption font-medium ${
        isPositive ? 'text-success' : 'text-destructive'
      }`}
      data-testid={`trend-${isPositive ? 'positive' : 'negative'}`}
    >
      {showIcon && (
        isPositive ? (
          <TrendingUp className="w-3 h-3" />
        ) : (
          <TrendingDown className="w-3 h-3" />
        )
      )}
      {displayValue}
    </span>
  );
}
