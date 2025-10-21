import { useState } from 'react';
import { DollarSign, MousePointerClick, TrendingUp, ShoppingCart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import MetricCard from '../components/MetricCard';
import {
  mockRevenueByPlatform,
  mockRevenueOverTime,
  mockTopProducts,
  mockRecentActivity
} from '../data/mockData';

const dateRanges = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'Custom Range'];

export default function Dashboard() {
  const [selectedRange, setSelectedRange] = useState('Last 30 days');

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

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
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {dateRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
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
    </div>
  );
}
