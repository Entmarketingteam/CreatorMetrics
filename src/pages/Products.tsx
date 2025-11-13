import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PeriodToggle } from '../components/ui/PeriodToggle';
import { ProductTile } from '../components/ui/ProductTile';

type Period = '7D' | '30D' | '1Y';

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

type SortKey = 'revenue' | 'sales' | 'conversionRate';

export default function Products() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<'7D' | '30D' | '1Y'>('30D');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('revenue');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [user, period]);

  const loadProducts = async () => {
    if (!user) {
      loadMockProducts();
      return;
    }

    try {
      setLoading(true);
      const daysAgo = period === '7D' ? 7 : period === '30D' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('avg_commission', { ascending: false });

      if (error) throw error;

      const formattedProducts: Product[] = (productsData || []).map((p: any) => ({
        id: p.id,
        name: p.name || 'Unknown Product',
        brand: p.brand || 'Unknown Brand',
        platform: p.platform || 'LTK',
        imageUrl: p.image_url || 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: p.avg_commission || 0,
        sales: p.total_sales || 0,
        clicks: p.total_clicks || 0,
        conversionRate: p.total_clicks > 0 ? ((p.total_sales / p.total_clicks) * 100) : 0,
      }));

      setProducts(formattedProducts);
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
        revenue: 44.07,
        sales: 6,
        clicks: 185,
        conversionRate: 3.2,
      },
      {
        id: '3',
        name: 'Oversized Denim Jacket',
        brand: 'Zara',
        platform: 'LTK',
        imageUrl: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 87.50,
        sales: 10,
        clicks: 250,
        conversionRate: 4.0,
      },
      {
        id: '4',
        name: 'Leather Ankle Boots',
        brand: 'Steve Madden',
        platform: 'Walmart',
        imageUrl: 'https://images.pexels.com/photos/336372/pexels-photo-336372.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 95.20,
        sales: 8,
        clicks: 210,
        conversionRate: 3.8,
      },
      {
        id: '5',
        name: 'Cashmere Sweater',
        brand: 'J.Crew',
        platform: 'ShopStyle',
        imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 125.80,
        sales: 15,
        clicks: 340,
        conversionRate: 4.4,
      },
      {
        id: '6',
        name: 'Wide Leg Trousers',
        brand: 'Madewell',
        platform: 'LTK',
        imageUrl: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg?auto=compress&cs=tinysrgb&w=400',
        revenue: 68.30,
        sales: 9,
        clicks: 220,
        conversionRate: 4.1,
      },
    ];
    setProducts(mockProducts);
    setLoading(false);
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === 'All' || product.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });

    return filtered.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [products, searchTerm, platformFilter, sortBy]);

  const totalRevenue = filteredAndSortedProducts.reduce((sum, p) => sum + p.revenue, 0);
  const totalSales = filteredAndSortedProducts.reduce((sum, p) => sum + p.sales, 0);

  return (
    <div className="space-y-4 w-full">
      {/* Header with Period Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-foreground">Products</h1>
          <p className="text-body text-muted-foreground mt-1">Track product performance</p>
        </div>
        <PeriodToggle periods={PERIODS} selected={period} onChange={(val) => setPeriod(val as Period)} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="text-caption text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-h2 font-bold text-foreground">${totalRevenue.toFixed(2)}</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="text-caption text-muted-foreground mb-1">Total Sales</div>
          <div className="text-h2 font-bold text-foreground">{totalSales}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex flex-col gap-3">
          <div className="relative">
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
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 text-body border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="select-platform-filter"
            >
              <option value="All">All Platforms</option>
              <option value="LTK">LTK</option>
              <option value="Amazon">Amazon</option>
              <option value="Walmart">Walmart</option>
              <option value="ShopStyle">ShopStyle</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="px-3 py-2 text-body border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="select-sort-by"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="sales">Sort by Sales</option>
              <option value="conversionRate">Sort by Conversion</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-caption text-muted-foreground">
        Showing {filteredAndSortedProducts.length} products
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full bg-card rounded-lg p-6 border border-border text-center text-muted-foreground">
            Loading products...
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="col-span-full bg-card rounded-lg p-6 border border-border text-center text-muted-foreground">
            No products found
          </div>
        ) : (
          filteredAndSortedProducts.map((product) => (
            <ProductTile
              key={product.id}
              id={product.id}
              name={product.name}
              store={product.brand}
              revenue={product.revenue}
              sales={product.sales}
              clicks={product.clicks}
              imageUrl={product.imageUrl}
            />
          ))
        )}
      </div>
    </div>
  );
}
