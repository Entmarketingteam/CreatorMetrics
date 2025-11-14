import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, Package, DollarSign } from 'lucide-react';
import { useLTKAuth } from '../hooks/useLTKAuth';
import { PeriodToggle } from '../components/ui/PeriodToggle';

type Period = '7D' | '30D' | '1Y';
type SortKey = 'revenue' | 'sales' | 'clicks';

const PERIODS = [
  { label: '7 days', value: '7D' },
  { label: '30 days', value: '30D' },
  { label: '1 year', value: '1Y' },
];

interface Product {
  id: string;
  name: string;
  brand: string;
  platform: string;
  imageUrl: string;
  revenue: number;
  sales: number;
  clicks: number;
  conversionRate: number;
}

interface SearchTrend {
  keyword: string;
  searches: number;
  trend: 'up' | 'down' | 'stable';
}

export default function Products() {
  const navigate = useNavigate();
  const { isAuthenticated, createClient } = useLTKAuth();
  const [period, setPeriod] = useState<Period>('30D');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadProductsData();
    }
  }, [isAuthenticated, period]);

  const loadProductsData = async () => {
    const ltkClient = createClient();
    if (!ltkClient) return;

    try {
      setLoading(true);

      const daysAgo = period === '7D' ? 7 : period === '30D' ? 30 : 365;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const [itemsRes, trendsRes] = await Promise.all([
        ltkClient.getItemsSold({
          limit: 50,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
        ltkClient.getLTKSearchTrends().catch(() => ({ data: null })),
      ]);

      if (itemsRes && itemsRes.data) {
        const items = (itemsRes.data.items || []).map((item: any) => ({
          id: item.product_id || item.id || Math.random().toString(),
          name: item.product_name || item.title || 'Product',
          brand: item.brand_name || item.retailer || 'Unknown Brand',
          platform: item.platform || 'LTK',
          imageUrl: item.image_url || item.product_image || '',
          revenue: item.commissions || item.revenue || 0,
          sales: item.quantity_sold || item.sales || 0,
          clicks: item.clicks || 0,
          conversionRate: item.clicks > 0 ? ((item.quantity_sold || 0) / item.clicks * 100) : 0,
        }));
        setProducts(items);
      } else {
        setProducts([]);
      }

      if (trendsRes && trendsRes.data && trendsRes.data.trends) {
        const trends = trendsRes.data.trends.slice(0, 10).map((trend: any) => ({
          keyword: trend.keyword || trend.term || 'Unknown',
          searches: trend.count || trend.volume || 0,
          trend: trend.change > 0 ? 'up' : trend.change < 0 ? 'down' : 'stable',
        }));
        setSearchTrends(trends);
      } else {
        setSearchTrends([]);
      }

    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      setSearchTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    return filtered.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [products, searchTerm, sortBy]);

  const totalRevenue = filteredAndSortedProducts.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = filteredAndSortedProducts.reduce((sum, p) => sum + p.sales, 0);
  const totalClicks = filteredAndSortedProducts.reduce((sum, p) => sum + p.clicks, 0);
  const avgConversion = totalClicks > 0 ? (totalSales / totalClicks * 100) : 0;

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">LTK Not Connected</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Please connect your LTK account to view product performance
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

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="text-products-title">Products</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track product performance and trends</p>
        </div>
        <PeriodToggle periods={PERIODS} selected={period} onChange={(val) => setPeriod(val as Period)} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-total-revenue">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-revenue">
            ${totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-total-sales">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Items Sold</p>
            <Package className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-sales">
            {totalSales}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-total-clicks">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clicks</p>
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-total-clicks">
            {totalClicks.toLocaleString()}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-avg-conversion">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Conversion</p>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="text-avg-conversion">
            {avgConversion.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Sort */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  data-testid="input-search-products"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="select-sort-by"
              >
                <option value="revenue">Sort by Revenue</option>
                <option value="sales">Sort by Sales</option>
                <option value="clicks">Sort by Clicks</option>
              </select>
            </div>
          </div>

          {/* Products List */}
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
              </div>
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
                No products found
              </div>
            ) : (
              filteredAndSortedProducts.map((product, index) => (
                <div 
                  key={product.id} 
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover-elevate"
                  data-testid={`card-product-${index}`}
                >
                  <div className="flex gap-4">
                    {product.imageUrl && (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-md"
                        data-testid={`img-product-${index}`}
                      />
                    )}
                    {!product.imageUrl && (
                      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {product.brand}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                          {product.platform}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.clicks} clicks
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.sales} sold
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {product.conversionRate.toFixed(1)}% conv
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        ${product.revenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        revenue
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredAndSortedProducts.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Showing {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Search Trends Sidebar */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4" data-testid="card-search-trends">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Search Trends</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Popular product searches</p>
            <div className="space-y-3">
              {searchTrends.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">No search trends available</p>
              ) : (
                searchTrends.map((trend, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between gap-3 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50"
                  data-testid={`item-trend-${index}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {trend.keyword}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {trend.searches.toLocaleString()} searches
                    </p>
                  </div>
                  <div>
                    {trend.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                    {trend.trend === 'down' && (
                      <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                    )}
                    {trend.trend === 'stable' && (
                      <div className="w-4 h-0.5 bg-gray-400" />
                    )}
                  </div>
                </div>
              )))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
