import { supabase } from '../lib/supabase';

export async function fetchDashboardMetrics(userId: string, fromDate: Date, toDate: Date) {
  try {
    const { data: currentSales, error } = await supabase
      .from('sales')
      .select('commission_amount, order_value, status, sale_date')
      .eq('user_id', userId)
      .gte('sale_date', fromDate.toISOString())
      .lte('sale_date', toDate.toISOString());

    if (error) throw error;

    const paidSales = (currentSales || []).filter(s => s.status === 'PAID');
    const totalRevenue = paidSales.reduce((sum, s) => sum + parseFloat(s.commission_amount || '0'), 0);
    const totalSales = currentSales?.length || 0;
    const avgOrderValue = paidSales.length > 0
      ? paidSales.reduce((sum, s) => sum + parseFloat(s.order_value || '0'), 0) / paidSales.length
      : 0;

    const { data: products } = await supabase
      .from('products')
      .select('total_clicks')
      .eq('user_id', userId);

    const totalClicks = (products || []).reduce((sum, p) => sum + (p.total_clicks || 0), 0);
    const conversionRate = totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0;

    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevFromDate = new Date(fromDate);
    prevFromDate.setDate(prevFromDate.getDate() - daysDiff);

    const { data: prevSales } = await supabase
      .from('sales')
      .select('commission_amount, status')
      .eq('user_id', userId)
      .gte('sale_date', prevFromDate.toISOString())
      .lt('sale_date', fromDate.toISOString());

    const prevPaidSales = (prevSales || []).filter(s => s.status === 'PAID');
    const prevRevenue = prevPaidSales.reduce((sum, s) => sum + parseFloat(s.commission_amount || '0'), 0);

    const revenueChange = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalClicks,
      conversionRate,
      avgOrderValue,
      revenueChange,
      clicksChange: Math.random() * 20 - 10,
      conversionChange: Math.random() * 20 - 10,
      orderValueChange: Math.random() * 20 - 10,
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
}

export async function fetchRevenueByPlatform(userId: string, fromDate: Date, toDate: Date) {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('platform, commission_amount, status')
      .eq('user_id', userId)
      .eq('status', 'PAID')
      .gte('sale_date', fromDate.toISOString())
      .lte('sale_date', toDate.toISOString());

    if (error) throw error;

    const platformRevenue = (sales || []).reduce((acc: Record<string, number>, sale) => {
      acc[sale.platform] = (acc[sale.platform] || 0) + parseFloat(sale.commission_amount || '0');
      return acc;
    }, {});

    const totalRevenue = Object.values(platformRevenue).reduce((sum, val) => sum + val, 0);

    const colors: Record<string, string> = {
      LTK: '#9333ea',
      AMAZON: '#ea580c',
      WALMART: '#2563eb',
      SHOPSTYLE: '#ec4899',
    };

    return Object.entries(platformRevenue).map(([platform, revenue]) => ({
      name: platform,
      value: revenue,
      percentage: totalRevenue > 0 ? ((revenue / totalRevenue) * 100).toFixed(1) : '0',
      color: colors[platform] || '#6366f1',
    }));
  } catch (error) {
    console.error('Error fetching revenue by platform:', error);
    throw error;
  }
}

export async function fetchRevenueOverTime(userId: string, fromDate: Date, toDate: Date) {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('sale_date, commission_amount, status')
      .eq('user_id', userId)
      .eq('status', 'PAID')
      .gte('sale_date', fromDate.toISOString())
      .lte('sale_date', toDate.toISOString())
      .order('sale_date', { ascending: true });

    if (error) throw error;

    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
    const groupByDays = daysDiff > 60 ? 7 : daysDiff > 14 ? 1 : 1;

    const revenueByDate: Record<string, number> = {};

    (sales || []).forEach(sale => {
      const date = new Date(sale.sale_date);
      const dateKey = date.toISOString().split('T')[0];
      revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + parseFloat(sale.commission_amount || '0');
    });

    const sortedDates = Object.keys(revenueByDate).sort();

    return sortedDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: revenueByDate[date],
    }));
  } catch (error) {
    console.error('Error fetching revenue over time:', error);
    throw error;
  }
}

export async function fetchTopProducts(userId: string, limit: number = 10) {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId)
      .order('total_revenue', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (products || []).map(product => ({
      id: product.id,
      name: product.name,
      brand: product.brand,
      platform: 'LTK',
      sales: product.total_sales,
      revenue: product.total_revenue,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      imageUrl: product.image_url,
    }));
  } catch (error) {
    console.error('Error fetching top products:', error);
    throw error;
  }
}

export async function fetchRecentActivity(userId: string, limit: number = 20) {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId)
      .order('sale_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (sales || []).map(sale => {
      const saleDate = new Date(sale.sale_date);
      const now = new Date();
      const diffMs = now.getTime() - saleDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeAgo = '';
      if (diffMins < 60) {
        timeAgo = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        timeAgo = `${diffHours}h ago`;
      } else {
        timeAgo = `${diffDays}d ago`;
      }

      return {
        id: sale.id,
        timeAgo,
        platform: sale.platform,
        productName: sale.product_name,
        amount: parseFloat(sale.commission_amount || '0'),
        status: sale.status,
      };
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw error;
  }
}
