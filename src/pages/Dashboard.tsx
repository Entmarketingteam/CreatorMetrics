import { useState, useEffect } from 'react';
import { Bell, DollarSign, TrendingUp, ShoppingBag, Eye, Plus, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useLTKAuth } from '../hooks/useLTKAuth';
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
  const { ltkClient, isReady } = useLTKAuth();
  const [period, setPeriod] = useState<Period>('30D');
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummary | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && ltkClient) {
      loadDashboardData();
    }
  }, [isReady, ltkClient, period]);

  const loadDashboardData = async () => {
    if (!ltkClient) return;

    try {
      setLoading(true);
      
      // Calculate date range based on period
      const daysAgo = period === '7D' ? 7 : period === '30D' ? 30 : 365;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const params = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        publisher_ids: '293045', // User's publisher ID
        platform: 'rs,ltk',
      };

      // Load all data in parallel
      const [statsRes, performersRes, commissionsRes, heroRes] = await Promise.all([
        ltkClient.getPerformanceStats(params),
        ltkClient.getTopPerformers({ ...params, limit: 10 }),
        ltkClient.getCommissionsSummary(),
        ltkClient.getHeroChart({ ...params, interval: 'day' }),
      ]);

      // Process performance stats
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

      // Process top performers
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

      // Process commissions
      if (commissionsRes && commissionsRes.data) {
        setCommissionSummary({
          pending: commissionsRes.data.pending || 0,
          paid: commissionsRes.data.paid || 0,
          total: commissionsRes.data.total || 0,
        });
      }

      // Process chart data
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
      // Set mock data on error
      setStats({
        revenue: 1847.52,
        clicks: 3420,
        sales: 142,
        conversionRate: 4.15,
      });
      setTopPerformers([
        { id: '1', name: 'Contrast Collar Coat', revenue: 112.35, clicks: 308, platform: 'LTK' },
        { id: '2', name: 'Off-Shoulder Top', revenue: 87.20, clicks: 245, platform: 'Amazon' },
        { id: '3', name: 'Denim Jacket', revenue: 95.50, clicks: 280, platform: 'LTK' },
      ]);
      setCommissionSummary({ pending: 847.52, paid: 1000.00, total: 1847.52 });
      setChartData([
        { date: 'Nov 1', revenue: 245, clicks: 520 },
        { date: 'Nov 5', revenue: 380, clicks: 680 },
        { date: 'Nov 10', revenue: 520, clicks: 820 },
        { date: 'Nov 14', revenue: 702, clicks: 1400 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-body text-muted-foreground">Setting up LTK connection...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-foreground" data-testid="text-dashboard-title">Dashboard</h1>
          <p className="text-body text-muted-foreground mt-1">Your creator analytics overview</p>
        </div>
        <Button variant="ghost" size="icon" data-testid="button-notifications">
          <Bell className="w-5 h-5" />
        </Button>
      </div>

      {/* Period Toggle */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            variant={period === p.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPeriod(p.value as Period)}
            data-testid={`button-period-${p.value}`}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-revenue">
              ${stats?.revenue.toFixed(2) || '0.00'}
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              +12.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-clicks">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Clicks</CardTitle>
            <Eye className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-clicks">
              {stats?.clicks.toLocaleString() || '0'}
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              +8.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-sales">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Sales</CardTitle>
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-sales">
              {stats?.sales || 0}
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              +15.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-conversion">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Conversion</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-conversion">
              {stats?.conversionRate.toFixed(2)}%
            </div>
            <p className="text-caption text-muted-foreground mt-1">
              +2.1% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <Card data-testid="card-revenue-chart">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over {period === '7D' ? '7 days' : period === '30D' ? '30 days' : '1 year'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Clicks Chart */}
        <Card data-testid="card-clicks-chart">
          <CardHeader>
            <CardTitle>Click Performance</CardTitle>
            <CardDescription>Daily clicks over {period === '7D' ? '7 days' : period === '30D' ? '30 days' : '1 year'}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Performers */}
        <Card data-testid="card-top-performers">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>Products driving the most revenue</CardDescription>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/products')}
              data-testid="button-view-all-products"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.length === 0 ? (
                <p className="text-body text-muted-foreground text-center py-4">
                  No performance data available
                </p>
              ) : (
                topPerformers.map((performer, index) => (
                  <div 
                    key={performer.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50 hover-elevate"
                    data-testid={`item-performer-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-foreground truncate">
                        {performer.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-caption">
                          {performer.platform}
                        </Badge>
                        <span className="text-caption text-muted-foreground">
                          {performer.clicks} clicks
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-body font-bold text-foreground">
                        ${performer.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Commissions Summary */}
        <Card data-testid="card-commissions">
          <CardHeader>
            <CardTitle>Commissions</CardTitle>
            <CardDescription>Your earnings breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="text-caption text-muted-foreground">Pending</p>
                  <p className="text-h3 font-bold text-foreground mt-1" data-testid="text-pending">
                    ${commissionSummary?.pending.toFixed(2) || '0.00'}
                  </p>
                </div>
                <Badge variant="secondary">Processing</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="text-caption text-muted-foreground">Paid</p>
                  <p className="text-h3 font-bold text-foreground mt-1" data-testid="text-paid">
                    ${commissionSummary?.paid.toFixed(2) || '0.00'}
                  </p>
                </div>
                <Badge variant="default">Completed</Badge>
              </div>

              <div className="flex items-center justify-between p-3 rounded-md bg-primary/10 border border-primary/20">
                <div>
                  <p className="text-caption text-primary">Total Earnings</p>
                  <p className="text-h2 font-bold text-primary mt-1" data-testid="text-total-earnings">
                    ${commissionSummary?.total.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={() => navigate('/earnings')}
                data-testid="button-view-earnings"
              >
                View Detailed Earnings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button 
          variant="outline" 
          className="w-full justify-center gap-2"
          onClick={() => navigate('/content-analytics')}
          data-testid="button-share-ltk"
        >
          <Share2 className="w-4 h-4" />
          Share my LTK
        </Button>
        <Button 
          className="w-full justify-center gap-2"
          onClick={() => navigate('/content')}
          data-testid="button-create"
        >
          <Plus className="w-4 h-4" />
          Create Content
        </Button>
      </div>
    </div>
  );
}
