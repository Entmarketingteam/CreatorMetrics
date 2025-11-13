import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export type DashboardPeriod = '7' | '30' | 'month';

export interface DashboardMetrics {
  totalRevenue: number;
  pendingPayment: number;
  totalClicks: number;
  totalSales: number;
  itemsSold: number;
  newFollowers: number;
  totalVisits: number;
  productClicks: number;
  trends: {
    revenue?: number;
    clicks?: number;
    sales?: number;
    visits?: number;
    followers?: number;
    productClicks?: number;
    itemsSold?: number;
  };
}

export interface TopPerformer {
  id: string;
  name: string;
  store?: string;
  platform?: string;
  revenue: number;
  sales: number;
  clicks?: number;
  imageUrl?: string;
  type: 'product' | 'post';
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
}

export function useDashboardData(period: DashboardPeriod) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Use mock data for unauthenticated users
      loadMockData();
      return;
    }

    loadRealData();
  }, [user, period]);

  const loadRealData = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      if (period === '7') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === '30') {
        startDate.setDate(endDate.getDate() - 30);
      } else {
        startDate.setDate(1); // First day of current month
      }

      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('user_id', user!.id)
        .gte('sale_date', startDate.toISOString())
        .lte('sale_date', endDate.toISOString());

      if (salesError) throw salesError;

      // Calculate metrics from real data
      const totalRevenue = sales?.reduce((sum, sale) => sum + (sale.commission_amount || 0), 0) || 0;
      const pendingPayment = sales?.filter(s => s.status === 'OPEN' || s.status === 'PENDING')
        .reduce((sum, sale) => sum + (sale.commission_amount || 0), 0) || 0;
      const totalSales = sales?.length || 0;

      // Fetch top products
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user!.id)
        .order('total_revenue', { ascending: false })
        .limit(5);

      const topProductsData: TopPerformer[] = (products || []).map(p => ({
        id: p.id,
        name: p.name,
        store: p.store || 'Unknown Store',
        platform: p.platform,
        revenue: p.total_revenue || 0,
        sales: p.total_sales || 0,
        type: 'product' as const,
      }));

      setMetrics({
        totalRevenue,
        pendingPayment,
        totalClicks: 8240, // Mock for now
        totalSales: totalSales,
        itemsSold: totalSales, // Simplified
        newFollowers: 485, // Mock
        totalVisits: 40300, // Mock
        productClicks: 26500, // Mock
        trends: {
          revenue: 11.48,
          clicks: -14.57,
          sales: -8.58,
          visits: -8.85,
          followers: -39.75,
          productClicks: -14.57,
          itemsSold: -8.58,
        },
      });

      setTopPerformers(topProductsData);
      setRevenueData([]); // Empty for now

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setMetrics({
      totalRevenue: 6099.57,
      pendingPayment: 97.01,
      totalClicks: 26500,
      totalSales: 97569.13,
      itemsSold: 1600,
      newFollowers: 485,
      totalVisits: 40300,
      productClicks: 26500,
      trends: {
        revenue: 11.48,
        clicks: -14.57,
        sales: -8.58,
        visits: -8.85,
        followers: -39.75,
        productClicks: -14.57,
        itemsSold: -8.58,
      },
    });

    setTopPerformers([
      {
        id: '1',
        name: 'All in Favor Contrast Collar Herringbone Coat',
        store: 'Nordstrom',
        revenue: 112.35,
        sales: 13,
        clicks: 308,
        type: 'product',
      },
      {
        id: '2',
        name: "Women's Off-The-Shoulder Twist Top",
        store: 'Abercrombie & Fitch (US)',
        revenue: 44.07,
        sales: 6,
        clicks: 1,
        type: 'product',
      },
    ]);

    setRevenueData([]);
    setLoading(false);
  };

  return {
    metrics,
    topPerformers,
    revenueData,
    loading,
  };
}
