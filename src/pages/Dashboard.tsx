import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PeriodToggle } from '../components/ui/PeriodToggle';
import { EarningsCard } from '../components/dashboard/EarningsCard';
import { AnalyticsSummary } from '../components/dashboard/AnalyticsSummary';
import { TopPerformers } from '../components/dashboard/TopPerformers';
import { useDashboardData, DashboardPeriod } from '../hooks/useDashboardData';
import { useAuth } from '../contexts/AuthContext';

const PERIODS = [
  { label: '7 days', value: '7' as DashboardPeriod },
  { label: '30 days', value: '30' as DashboardPeriod },
  { label: 'This month', value: 'month' as DashboardPeriod },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('30');

  const { metrics, topPerformers, loading } = useDashboardData(selectedPeriod);

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case '7': return '7 days';
      case '30': return '30 days';
      case 'month': return 'this month';
      default: return '30 days';
    }
  };

  // Get user's first name for greeting
  const firstName = user?.email?.split('@')[0] || 'Creator';
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-body text-muted-foreground">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-h1 font-bold text-foreground" data-testid="text-greeting">
            Hi, {displayName}
          </h1>
          <button
            className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-notifications"
          >
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
          </button>
        </div>

        {/* Period Toggle */}
        <div className="mb-6">
          <PeriodToggle
            periods={PERIODS}
            selected={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value as DashboardPeriod)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <EarningsCard
              totalRevenue={metrics.totalRevenue}
              pendingPayment={metrics.pendingPayment}
              period={getPeriodLabel()}
              onViewDetails={() => navigate('/earnings')}
            />

            <AnalyticsSummary
              metrics={metrics}
              period={getPeriodLabel()}
              onViewAll={() => navigate('/analytics')}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <TopPerformers
              performers={topPerformers}
              period={getPeriodLabel()}
              onViewMore={() => navigate('/products')}
            />
          </div>
        </div>

        {/* Bottom Action Buttons - LTK Style */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <button
            className="py-4 bg-foreground text-background font-semibold rounded-lg hover-elevate active-elevate-2 flex items-center justify-center gap-2"
            data-testid="button-share-ltk"
          >
            <span>↑</span>
            Share my LTK
          </button>
          <button
            className="py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover-elevate active-elevate-2 flex items-center justify-center gap-2"
            onClick={() => navigate('/content')}
            data-testid="button-create"
          >
            <span>+</span>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
