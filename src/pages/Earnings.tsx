import { useState, useMemo, useEffect } from 'react';
import { Search, Download, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PeriodToggle } from '../components/ui/PeriodToggle';

type Period = '7D' | '30D' | '1Y';

const PERIODS = [
  { label: '7 days', value: '7D' },
  { label: '30 days', value: '30D' },
  { label: '1 year', value: '1Y' },
];

interface Sale {
  id: string;
  date: string;
  platform: string;
  product: string;
  brand: string;
  type: string;
  status: string;
  amount: number;
}

const ITEMS_PER_PAGE = 20;

export default function Earnings() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('30D');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, [user, period]);

  const loadSales = async () => {
    if (!user) {
      loadMockSales();
      return;
    }

    try {
      setLoading(true);
      const daysAgo = period === '7D' ? 7 : period === '30D' ? 30 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .gte('sale_date', startDate.toISOString())
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const formattedSales: Sale[] = (data || []).map((sale: any) => ({
        id: sale.id,
        date: sale.sale_date,
        platform: sale.platform || 'LTK',
        product: sale.product_name || 'Unknown Product',
        brand: sale.brand || 'Unknown Brand',
        type: sale.sale_type || 'Commission',
        status: sale.status || 'OPEN',
        amount: sale.commission_amount || 0,
      }));

      setSales(formattedSales);
    } catch (error) {
      console.error('Error loading sales:', error);
      loadMockSales();
    } finally {
      setLoading(false);
    }
  };

  const loadMockSales = () => {
    const mockSales: Sale[] = [
      {
        id: '1',
        date: '2024-11-10',
        platform: 'LTK',
        product: 'All in Favor Contrast Collar Herringbone Coat',
        brand: 'Nordstrom',
        type: 'Commission',
        status: 'PAID',
        amount: 8.64,
      },
      {
        id: '2',
        date: '2024-11-09',
        platform: 'Amazon',
        product: "Women's Off-The-Shoulder Twist Top",
        brand: 'Abercrombie & Fitch',
        type: 'Commission',
        status: 'PENDING',
        amount: 7.35,
      },
      {
        id: '3',
        date: '2024-11-08',
        platform: 'LTK',
        product: 'Oversized Denim Jacket',
        brand: 'Zara',
        type: 'Commission',
        status: 'OPEN',
        amount: 12.50,
      },
    ];
    setSales(mockSales);
    setLoading(false);
  };

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const matchesSearch = sale.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           sale.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === 'All' || sale.platform === platformFilter;
      const matchesStatus = statusFilter === 'All' || sale.status === statusFilter;
      return matchesSearch && matchesPlatform && matchesStatus;
    });
  }, [sales, searchTerm, platformFilter, statusFilter]);

  const totalPages = Math.ceil(filteredSales.length / ITEMS_PER_PAGE);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalEarnings = filteredSales.reduce((sum, sale) => sum + sale.amount, 0);
  const paidEarnings = filteredSales.filter(s => s.status === 'PAID').reduce((sum, sale) => sum + sale.amount, 0);
  const pendingEarnings = filteredSales.filter(s => s.status === 'PENDING').reduce((sum, sale) => sum + sale.amount, 0);

  const exportToCSV = () => {
    const headers = ['Date', 'Platform', 'Product', 'Brand', 'Type', 'Status', 'Amount'];
    const csvData = [
      headers.join(','),
      ...filteredSales.map(sale =>
        [sale.date, sale.platform, `"${sale.product}"`, sale.brand, sale.type, sale.status, sale.amount].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getPlatformBadgeColor = (platform: string) => {
    const colors = {
      LTK: 'bg-primary/10 text-primary',
      Amazon: 'bg-orange-500/10 text-orange-600 dark:text-orange-500',
      Walmart: 'bg-blue-500/10 text-blue-600 dark:text-blue-500',
      ShopStyle: 'bg-pink-500/10 text-pink-600 dark:text-pink-500'
    };
    return colors[platform as keyof typeof colors] || colors.LTK;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      PAID: 'bg-green-500/10 text-green-600 dark:text-green-500',
      PENDING: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
      OPEN: 'bg-blue-500/10 text-blue-600 dark:text-blue-500'
    };
    return colors[status as keyof typeof colors] || colors.OPEN;
  };

  return (
    <div className="space-y-4 w-full">
      {/* Header with Period Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-h1 font-bold text-foreground">Earnings</h1>
          <p className="text-body text-muted-foreground mt-1">Track commission earnings</p>
        </div>
        <PeriodToggle periods={PERIODS} selected={period} onChange={(val) => setPeriod(val as Period)} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="text-caption text-muted-foreground mb-1">Total Earnings</div>
          <div className="text-h2 font-bold text-foreground">${totalEarnings.toFixed(2)}</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="text-caption text-muted-foreground mb-1">Paid</div>
          <div className="text-h2 font-bold text-green-600 dark:text-green-500">${paidEarnings.toFixed(2)}</div>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="text-caption text-muted-foreground mb-1">Pending</div>
          <div className="text-h2 font-bold text-yellow-600 dark:text-yellow-500">${pendingEarnings.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search products or brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-body text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-search-earnings"
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-body border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="select-status-filter"
            >
              <option value="All">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OPEN">Open</option>
            </select>
            <button
              onClick={exportToCSV}
              className="ml-auto px-4 py-2 border border-border rounded-md text-body text-foreground hover-elevate active-elevate-2 flex items-center gap-2"
              data-testid="button-export-csv"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-caption text-muted-foreground">
        <span>Showing {paginatedSales.length} of {filteredSales.length} transactions</span>
        {totalPages > 1 && (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {loading ? (
          <div className="bg-card rounded-lg p-6 border border-border text-center text-muted-foreground">
            Loading transactions...
          </div>
        ) : paginatedSales.length === 0 ? (
          <div className="bg-card rounded-lg p-6 border border-border text-center text-muted-foreground">
            No transactions found
          </div>
        ) : (
          paginatedSales.map((sale) => (
            <div
              key={sale.id}
              className="bg-card rounded-lg p-4 border border-border hover-elevate active-elevate-2 cursor-pointer"
              data-testid={`transaction-${sale.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`px-2 py-1 rounded text-caption font-medium ${getPlatformBadgeColor(sale.platform)}`}>
                      {sale.platform}
                    </div>
                    <div className={`px-2 py-1 rounded text-caption font-medium ${getStatusBadgeColor(sale.status)}`}>
                      {sale.status}
                    </div>
                  </div>
                  <h3 className="text-body font-semibold text-foreground mb-1 line-clamp-1">
                    {sale.product}
                  </h3>
                  <div className="flex items-center gap-4 text-caption text-muted-foreground">
                    <span>{sale.brand}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(sale.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-h3 font-bold text-foreground">
                    ${sale.amount.toFixed(2)}
                  </div>
                  <div className="text-caption text-muted-foreground">
                    {sale.type}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-border rounded-md text-body text-foreground hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-previous-page"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-border rounded-md text-body text-foreground hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-next-page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
