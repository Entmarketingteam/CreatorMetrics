import { ArrowRight, Info } from 'lucide-react';

interface EarningsCardProps {
  totalRevenue: number;
  pendingPayment: number;
  period: string;
  onViewDetails?: () => void;
}

export function EarningsCard({ totalRevenue, pendingPayment, period, onViewDetails }: EarningsCardProps) {
  return (
    <div className="bg-card rounded-lg p-6 card-shadow" data-testid="card-earnings">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-h3 text-foreground font-semibold flex items-center gap-2">
          Earnings
          <Info className="w-4 h-4 text-muted-foreground" />
        </h2>
      </div>
      <p className="text-caption text-muted-foreground mb-4">Last {period}</p>
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-h1 font-bold text-foreground" data-testid="text-total-revenue">
            ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h1>
          <ArrowRight className="w-5 h-5 text-muted-foreground" />
        </div>
        {pendingPayment > 0 && (
          <p className="text-caption text-muted-foreground flex items-center gap-1">
            <Info className="w-3 h-3" />
            Pending payment: ${pendingPayment.toFixed(2)}
          </p>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <button
          onClick={onViewDetails}
          className="flex items-center justify-between w-full text-body text-foreground hover:text-primary transition-colors"
          data-testid="button-view-commissions"
        >
          <span className="font-medium">Commissions</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">${totalRevenue.toFixed(2)}</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </button>
      </div>
    </div>
  );
}
