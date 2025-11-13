import { useState, useEffect } from 'react';
import { DollarSign, MousePointerClick, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight, Instagram, Lightbulb, ArrowRight, Eye, Download } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import MetricCard from '../components/MetricCard';
import LTKStatsWidget from '../components/LTKStatsWidget';
import {
  mockRevenueByPlatform,
  mockRevenueOverTime,
  mockTopProducts,
  mockRecentActivity
} from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const dateRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days'];

interface TopPost {
  id: string;
  post_type: string;
  caption: string;
  posted_at: string;
  thumbnail_url: string;
  engagement_rate: number;
  attributed_revenue: number;
  attributed_sales: number;
}

interface Insight {
  id: string;
  priority: string;
  title: string;
  description: string;
  actionable: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedRange, setSelectedRange] = useState('Last 30 days');
  const [showDateModal, setShowDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [topPosts, setTopPosts] = useState<TopPost[]>([]);
  const [topInsights, setTopInsights] = useState<Insight[]>([]);

  useEffect(() => {
    loadTopPosts();
    loadTopInsights();
  }, [user]);

  const loadTopPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('social_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('attributed_revenue', { ascending: false })
      .limit(3);

    if (data) setTopPosts(data);
  };

  const loadTopInsights = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('insights')
      .select('*')
      .eq('user_id', user.id)
      .eq('priority', 'HIGH')
      .is('dismissed_at', null)
      .order('created_at', { ascending: false })
      .limit(2);

    if (data) setTopInsights(data);
  };

  const exportDashboardReport = () => {
    const report = `CREATORMETRICS DASHBOARD REPORT
Generated: ${new Date().toLocaleString()}

OVERVIEW
--------
Total Revenue: $12,450
Total Clicks: 8,240
Conversion Rate: 3.8%
Average Order Value: $42.30

REVENUE BY PLATFORM
-------------------
${mockRevenueByPlatform.map(p => `${p.platform}: $${p.revenue.toFixed(2)}`).join('\n')}

TOP PRODUCTS
------------
${mockTopProducts.map(p => `${p.name} (${p.platform}): $${p.revenue.toFixed(2)} - ${p.sales} sales`).join('\n')}

TOP CONTENT
-----------
${topPosts.map(p => `${p.post_type}: $${p.attributed_revenue.toFixed(2)} revenue - ${p.attributed_sales} sales`).join('\n')}

INSIGHTS
--------
${topInsights.map(i => `${i.priority}: ${i.title}\n  ${i.actionable}`).join('\n\n')}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  };

  const getPlatformIcon = (platform: string) => {
    const colors = {
      LTK: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      Amazon: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      Walmart: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      ShopStyle: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400'
    };
    return colors[platform as keyof typeof colors] || colors.LTK;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      Paid: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
      Pending: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
      Open: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
    };
    return styles[status as keyof typeof styles] || styles.Open;
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Welcome back! Here's your performance overview.</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={exportDashboardReport}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Report</span>
          </button>
          <select
            value={selectedRange === 'Last 7 days' ? '7' : selectedRange === 'Last 30 days' ? '30' : selectedRange === 'Last 90 days' ? '90' : 'custom'}
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'custom') {
                setShowDateModal(true);
              } else if (value === '7') {
                setSelectedRange('Last 7 days');
              } else if (value === '30') {
                setSelectedRange('Last 30 days');
              } else if (value === '90') {
                setSelectedRange('Last 90 days');
              }
            }}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="custom">{selectedRange.includes(' to ') ? selectedRange : 'Custom Range'}</option>
          </select>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Revenue"
          value="$12,450"
          change={15.3}
          changeLabel="+15.3% vs last month"
          icon={<DollarSign className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        />
        <MetricCard
          title="Total Clicks"
          value="8,240"
          icon={<MousePointerClick className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        />
        <MetricCard
          title="Conversion Rate"
          value="3.8%"
          change={0.4}
          changeLabel="+0.4%"
          icon={<TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        />
        <MetricCard
          title="Avg Order Value"
          value="$42.30"
          change={-2.1}
          changeLabel="-$2.10"
          icon={<ShoppingCart className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        />
      </div>

      {/* LTK Stats Widget */}
      <LTKStatsWidget />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Revenue by Platform */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full overflow-hidden">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue by Platform</h2>
          <div className="h-64 flex items-center justify-center w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockRevenueByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {mockRevenueByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {mockRevenueByPlatform.map((platform) => (
              <div key={platform.platform} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: platform.color }}></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{platform.platform}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white ml-auto">
                  {formatCurrency(platform.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full overflow-hidden">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Over Time</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRevenueOverTime}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => new Date(value).getDate().toString()}
                  stroke="#9ca3af"
                  fontSize={12}
                />
                <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value}`} fontSize={12} />
                <Tooltip
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value) => [formatCurrency(value as number), 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#colorRevenue)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Top Performing Products */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full overflow-hidden">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Products</h2>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Product Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Platform</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Sales</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Revenue</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">Trend</th>
                </tr>
              </thead>
              <tbody>
                {mockTopProducts.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-medium">{product.name}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPlatformIcon(product.platform)}`}>
                        {product.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{product.sales}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center gap-1 text-sm font-medium ${
                        product.trend > 0 ? 'text-green-600 dark:text-green-400' :
                        product.trend < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {product.trend > 0 ? <ArrowUpRight className="w-4 h-4" /> :
                         product.trend < 0 ? <ArrowDownRight className="w-4 h-4" /> :
                         <span className="w-4 h-4">→</span>}
                        {product.trend !== 0 ? `${Math.abs(product.trend).toFixed(0)}%` : '0%'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full overflow-hidden">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {mockRecentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <div className={`p-2 rounded-lg ${getPlatformIcon(activity.platform)}`}>
                  <span className="text-xs font-bold">{activity.platform.substring(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{activity.productName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.timeAgo}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(activity.amount)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(activity.status)}`}>
                      {activity.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      {topPosts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Top Performing Content</h2>
            <Link
              to="/content"
              className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topPosts.map((post) => (
              <Link
                key={post.id}
                to="/content"
                className="group bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div
                  className="h-32 relative"
                  style={{ background: post.thumbnail_url }}
                >
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 px-2 py-1 rounded-full text-xs font-medium">
                    <Instagram className="w-3 h-3" />
                    <span>{post.post_type}</span>
                  </div>
                  <div className="absolute top-2 right-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
                    {getRelativeTime(post.posted_at)}
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {post.caption}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Eye className="w-3 h-3" />
                      <span>{post.engagement_rate.toFixed(1)}%</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600 dark:text-green-400">
                        ${post.attributed_revenue.toFixed(0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {post.attributed_sales} sales
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Latest Insights */}
      {topInsights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 w-full overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Latest Insights</h2>
            <Link
              to="/insights"
              className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
            >
              See All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {topInsights.map((insight) => (
              <Link
                key={insight.id}
                to="/insights"
                className="block bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 hover:shadow-md transition-shadow border border-indigo-200 dark:border-indigo-800"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full font-medium">
                        {insight.priority} PRIORITY
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                      <TrendingUp className="w-4 h-4" />
                      <span>{insight.actionable}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showDateModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDateModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Select Date Range
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDateModal(false);
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!customStartDate || !customEndDate) {
                    alert('Please select both dates');
                    return;
                  }
                  if (new Date(customStartDate) > new Date(customEndDate)) {
                    alert('Start date must be before end date');
                    return;
                  }
                  const formattedRange = `${new Date(customStartDate).toLocaleDateString()} to ${new Date(customEndDate).toLocaleDateString()}`;
                  setSelectedRange(formattedRange);
                  setShowDateModal(false);
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
