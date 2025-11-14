import { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, Package, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useLTKAuth } from '../hooks/useLTKAuth';

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
  const { ltkClient, isReady } = useLTKAuth();
  const [period, setPeriod] = useState<Period>('30D');
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isReady && ltkClient) {
      loadProductsData();
    }
  }, [isReady, ltkClient, period]);

  const loadProductsData = async () => {
    if (!ltkClient) return;

    try {
      setLoading(true);

      // Calculate date range
      const daysAgo = period === '7D' ? 7 : period === '30D' ? 30 : 365;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Load items sold and search trends in parallel
      const [itemsRes, trendsRes] = await Promise.all([
        ltkClient.getItemsSold({
          limit: 50,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        }),
        ltkClient.getSearchTrends().catch(() => ({ data: null })),
      ]);

      // Process items sold data
      if (itemsRes && itemsRes.data) {
        const items = (itemsRes.data.items || []).map((item: any) => ({
          id: item.product_id || item.id || Math.random().toString(),
          name: item.product_name || item.title || 'Product',
          brand: item.brand_name || item.retailer || 'Unknown Brand',
          platform: item.platform || 'LTK',
          imageUrl: item.image_url || item.product_image || 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400',
          revenue: item.commissions || item.revenue || 0,
          sales: item.quantity_sold || item.sales || 0,
          clicks: item.clicks || 0,
          conversionRate: item.clicks > 0 ? ((item.quantity_sold || 0) / item.clicks * 100) : 0,
        }));
        setProducts(items);
      } else {
        loadMockProducts();
      }

      // Process search trends
      if (trendsRes && trendsRes.data && trendsRes.data.trends) {
        const trends = trendsRes.data.trends.slice(0, 10).map((trend: any) => ({
          keyword: trend.keyword || trend.term || 'Unknown',
          searches: trend.count || trend.volume || 0,
          trend: trend.change > 0 ? 'up' : trend.change < 0 ? 'down' : 'stable',
        }));
        setSearchTrends(trends);
      } else {
        setSearchTrends([
          { keyword: 'winter coat', searches: 1240, trend: 'up' },
          { keyword: 'leather boots', searches: 980, trend: 'up' },
          { keyword: 'sweater dress', searches: 850, trend: 'stable' },
        ]);
      }

    } catch (error) {
      console.error('Error loading products:', error);
      loadMockProducts();
    } finally {
      setLoading(false);
    }
  };

  const loadMockProducts = () => {
    const mockProducts: Product[] = [
      {
        id: '1',
        name: 'All in Favor Contrast Collar Herringbone Coat',
        brand: 'Nordstrom',
        platform: 'LTK',
        imageUrl: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 112.35,
        sales: 13,
        clicks: 308,
        conversionRate: 4.2,
      },
      {
        id: '2',
        name: "Women's Off-The-Shoulder Twist Top",
        brand: 'Abercrombie & Fitch',
        platform: 'Amazon',
        imageUrl: 'https://images.pexels.com/photos/1926769/pexels-photo-1926769.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 87.20,
        sales: 9,
        clicks: 245,
        conversionRate: 3.7,
      },
      {
        id: '3',
        name: 'Oversized Denim Jacket',
        brand: 'Zara',
        platform: 'LTK',
        imageUrl: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 95.50,
        sales: 11,
        clicks: 280,
        conversionRate: 3.9,
      },
      {
        id: '4',
        name: 'Leather Ankle Boots',
        brand: 'Steve Madden',
        platform: 'Walmart',
        imageUrl: 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 125.80,
        sales: 15,
        clicks: 340,
        conversionRate: 4.4,
      },
      {
        id: '5',
        name: 'Cashmere Sweater',
        brand: 'J.Crew',
        platform: 'ShopStyle',
        imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 98.60,
        sales: 12,
        clicks: 295,
        conversionRate: 4.1,
      },
    ];
    setProducts(mockProducts);
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

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-foreground" data-testid="text-products-title">Products</h1>
          <p className="text-body text-muted-foreground mt-1">Track product performance and trends</p>
        </div>
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
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-revenue">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Total Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-total-revenue">
              ${totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-sales">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Items Sold</CardTitle>
            <Package className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-total-sales">
              {totalSales}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-total-clicks">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Total Clicks</CardTitle>
            <Search className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-total-clicks">
              {totalClicks.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-conversion">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-caption font-medium">Avg Conversion</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-h2 font-bold" data-testid="text-avg-conversion">
              {avgConversion.toFixed(2)}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Sort */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-body text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    data-testid="input-search-products"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="px-3 py-2 text-body border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="select-sort-by"
                >
                  <option value="revenue">Sort by Revenue</option>
                  <option value="sales">Sort by Sales</option>
                  <option value="clicks">Sort by Clicks</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Products List */}
          <div className="space-y-3">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-body text-muted-foreground">Loading products...</p>
                </CardContent>
              </Card>
            ) : filteredAndSortedProducts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No products found
                </CardContent>
              </Card>
            ) : (
              filteredAndSortedProducts.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="hover-elevate"
                  data-testid={`card-product-${index}`}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-md"
                        data-testid={`img-product-${index}`}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-body font-semibold text-foreground truncate">
                          {product.name}
                        </h3>
                        <p className="text-caption text-muted-foreground mt-1">
                          {product.brand}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-caption">
                            {product.platform}
                          </Badge>
                          <span className="text-caption text-muted-foreground">
                            {product.clicks} clicks
                          </span>
                          <span className="text-caption text-muted-foreground">
                            {product.sales} sold
                          </span>
                          <span className="text-caption text-muted-foreground">
                            {product.conversionRate.toFixed(1)}% conv
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-h3 font-bold text-foreground">
                          ${product.revenue.toFixed(2)}
                        </p>
                        <p className="text-caption text-muted-foreground mt-1">
                          revenue
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredAndSortedProducts.length > 0 && (
            <p className="text-caption text-muted-foreground text-center">
              Showing {filteredAndSortedProducts.length} product{filteredAndSortedProducts.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Search Trends Sidebar */}
        <div>
          <Card data-testid="card-search-trends">
            <CardHeader>
              <CardTitle>Search Trends</CardTitle>
              <CardDescription>Popular product searches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchTrends.map((trend, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between gap-3 p-3 rounded-md bg-muted/50"
                    data-testid={`item-trend-${index}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-foreground truncate">
                        {trend.keyword}
                      </p>
                      <p className="text-caption text-muted-foreground mt-1">
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
                        <div className="w-4 h-0.5 bg-muted-foreground" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
