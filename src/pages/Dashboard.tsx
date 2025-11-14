import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, DollarSign, TrendingUp, ShoppingBag, Eye } from 'lucide-react';
import { useLTKAuth } from '../hooks/useLTKAuth';
import { PeriodToggle } from '../components/ui/PeriodToggle';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type Period = '7D' | '30D' | '1Y';

const PERIODS = [
  { label: '7 days', value: '7D' },
  { label: '30 days', value: '30D' },
  { label: '1 year', value: '1Y' },
];

interface PerformanceStats {
  revenue: number;
  clicks: number;
  sales: number;
  conversionRate: number;
}

interface TopPerformer {
  id: string;
  name: string;
  revenue: number;
  clicks: number;
  platform: string;
}

interface CommissionSummary {
  pending: number;
  paid: number;
  total: number;
}

interface ChartDataPoint {
  date: string;
  revenue: number;
  clicks: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, createClient } = useLTKAuth();
  const [period, setPeriod] = useState<Period>('30D');
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, period]);

  const loadDashboardData = async () => {
    const ltkClient = createClient();
    if (!ltkClient) return;

    try {
      setLoading(true);
      
      const daysAgo = period === '7D' ? 7 : period === '30D' ? 30 : 365;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        publisher_ids: '293045',
        platform: 'rs,ltk',
      };

      const [statsRes, performersRes, commissionsRes, heroRes] = await Promise.all([
        ltkClient.getPerformanceStats(params),
        ltkClient.getTopPerformers({ ...params, limit: 10 }),
        ltkClient.getCommissionsSummary(),
        ltkClient.getHeroChart({ ...params, interval: 'day' }),
      ]);

      if (statsRes && statsRes.data) {
        const data = statsRes.data;
        setStats({
          revenue: data.total_revenue || 0,
          clicks: data.total_clicks || 0,
          sales: data.total_sales || 0,
          conversionRate: data.total_clicks > 0 
            ? ((data.total_sales / data.total_clicks) * 100) 
            : 0,
        });
      }

      if (performersRes && performersRes.data) {
        const performers = (performersRes.data.items || []).slice(0, 5).map((item: any) => ({
          id: item.id || Math.random().toString(),
          name: item.product_name || item.title || 'Product',
          revenue: item.revenue || item.commissions || 0,
          clicks: item.clicks || 0,
          platform: item.platform || 'LTK',
        }));
        setTopPerformers(performers);
      }

      if (commissionsRes && commissionsRes.data) {
        setCommissionSummary({
          pending: commissionsRes.data.pending || 0,
          paid: commissionsRes.data.paid || 0,
          total: commissionsRes.data.total || 0,
        });
      }

      if (heroRes && heroRes.data && heroRes.data.chart_data) {
        const formattedChartData = heroRes.data.chart_data.map((point: any) => ({
          date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: point.revenue || 0,
          clicks: point.clicks || 0,
        }));
        setChartData(formattedChartData);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setStats(null);
      setTopPerformers([]);
      setCommissionSummary(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">LTK Not Connected</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please connect your LTK account to view dashboard metrics
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover-elevate active-elevate-2"
          >
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Your creator analytics overview</p>
        </div>
        <button className="p-2 text-gray-600 dark:text-gray-400 hover-elevate active-elevate-2" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
        </button>
      </div>

      {/* Period Toggle */}
      <PeriodToggle periods={PERIODS} selected={period} onChange={(val) => setPeriod(val as Period)} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-revenue">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</p>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-revenue">
            ${stats?.revenue.toFixed(2) || '0.00'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">+12.5% from last period</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-clicks">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clicks</p>
            <Eye className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-clicks">
            {stats?.clicks.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">+8.2% from last period</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-sales">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sales</p>
            <ShoppingBag className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-sales">
            {stats?.sales || 0}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">+15.3% from last period</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-conversion">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion</p>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-conversion">
            {stats?.conversionRate.toFixed(2)}%
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">+2.1% from last period</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-revenue-chart">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Revenue Trend</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Daily revenue over {period === '7D' ? '7 days' : period === '30D' ? '30 days' : '1 year'}</p>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} style={{ fontSize: '12px' }} />
              <YAxis tick={{ fill: '#9ca3af' }} style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#revenueGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-clicks-chart">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Click Performance</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Daily clicks over {period === '7D' ? '7 days' : period === '30D' ? '30 days' : '1 year'}</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} style={{ fontSize: '12px' }} />
              <YAxis tick={{ fill: '#9ca3af' }} style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px' }} />
              <Line type="monotone" dataKey="clicks" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-top-performers">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Performers</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Products driving the most revenue</p>
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              data-testid="button-view-all-products"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">No performance data available</p>
            ) : (
              topPerformers.map((performer, index) => (
                <div 
                  key={performer.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50 hover-elevate"
                  data-testid={`item-performer-${index}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {performer.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {performer.platform}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {performer.clicks} clicks
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    ${performer.revenue.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Commissions Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-commissions">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Commissions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Your earnings breakdown</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1" data-testid="text-pending">
                  ${commissionSummary?.pending.toFixed(2) || '0.00'}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                Processing
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-gray-50 dark:bg-gray-700/50">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Paid</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1" data-testid="text-paid">
                  ${commissionSummary?.paid.toFixed(2) || '0.00'}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Completed
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-md bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
              <div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400">Total Earnings</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1" data-testid="text-total-earnings">
                  ${commissionSummary?.total.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => navigate('/earnings')}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover-elevate active-elevate-2"
              data-testid="button-view-earnings"
            >
              View Detailed Earnings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
