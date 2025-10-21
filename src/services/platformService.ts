import { supabase } from '../lib/supabase';

export type Platform = 'LTK' | 'AMAZON' | 'WALMART' | 'SHOPSTYLE';

interface ProductData {
  name: string;
  brand: string;
  category: string;
  commission: { min: number; max: number };
}

const platformProducts: Record<Platform, ProductData[]> = {
  LTK: [
    { name: 'Align High-Rise Leggings', brand: 'Lululemon', category: 'Activewear', commission: { min: 12, max: 45 } },
    { name: 'Good American Jeans', brand: 'Good American', category: 'Denim', commission: { min: 15, max: 38 } },
    { name: 'The Dad Sneaker', brand: 'New Balance', category: 'Footwear', commission: { min: 10, max: 28 } },
    { name: 'Slouchy Cardigan', brand: 'Free People', category: 'Sweaters', commission: { min: 18, max: 42 } },
    { name: 'Mini Crossbody Bag', brand: 'Marc Jacobs', category: 'Accessories', commission: { min: 20, max: 55 } },
    { name: 'Slip Dress', brand: 'Abercrombie', category: 'Dresses', commission: { min: 8, max: 25 } },
    { name: 'Oversized Blazer', brand: 'ASOS', category: 'Outerwear', commission: { min: 12, max: 32 } },
  ],
  AMAZON: [
    { name: 'Echo Dot (5th Gen)', brand: 'Amazon', category: 'Electronics', commission: { min: 2, max: 8 } },
    { name: 'Wireless Earbuds', brand: 'Sony', category: 'Audio', commission: { min: 5, max: 18 } },
    { name: 'Smart Watch', brand: 'Fitbit', category: 'Wearables', commission: { min: 8, max: 25 } },
    { name: 'LED Desk Lamp', brand: 'TaoTronics', category: 'Home', commission: { min: 3, max: 12 } },
    { name: 'Vitamin C Serum', brand: 'TruSkin', category: 'Beauty', commission: { min: 2, max: 9 } },
    { name: 'Weighted Blanket', brand: 'YnM', category: 'Bedding', commission: { min: 4, max: 15 } },
    { name: 'Instant Pot Duo', brand: 'Instant Pot', category: 'Kitchen', commission: { min: 6, max: 22 } },
  ],
  WALMART: [
    { name: 'Great Value Paper Towels', brand: 'Great Value', category: 'Household', commission: { min: 1, max: 4 } },
    { name: 'Equate Multivitamins', brand: 'Equate', category: 'Health', commission: { min: 1, max: 5 } },
    { name: 'Mainstays Towel Set', brand: 'Mainstays', category: 'Home', commission: { min: 2, max: 8 } },
    { name: 'Time and Tru Tee', brand: 'Time and Tru', category: 'Apparel', commission: { min: 1, max: 6 } },
    { name: 'Better Homes Coffee Maker', brand: 'Better Homes', category: 'Kitchen', commission: { min: 3, max: 12 } },
    { name: 'Ozark Trail Cooler', brand: 'Ozark Trail', category: 'Outdoor', commission: { min: 4, max: 15 } },
  ],
  SHOPSTYLE: [
    { name: 'Leather Ankle Boots', brand: 'Sam Edelman', category: 'Footwear', commission: { min: 15, max: 35 } },
    { name: 'Silk Blouse', brand: 'Equipment', category: 'Tops', commission: { min: 12, max: 30 } },
    { name: 'Gold Hoop Earrings', brand: 'Mejuri', category: 'Jewelry', commission: { min: 8, max: 22 } },
    { name: 'Cashmere Scarf', brand: 'Everlane', category: 'Accessories', commission: { min: 10, max: 28 } },
    { name: 'Midi Skirt', brand: 'Reformation', category: 'Bottoms', commission: { min: 14, max: 32 } },
    { name: 'Sunglasses', brand: 'Ray-Ban', category: 'Accessories', commission: { min: 12, max: 30 } },
  ],
};

function getRandomProduct(platform: Platform): ProductData {
  const products = platformProducts[platform];
  return products[Math.floor(Math.random() * products.length)];
}

function getRandomCommission(min: number, max: number): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function getRandomDate(daysAgo: number = 7): Date {
  const now = new Date();
  const random = Math.floor(Math.random() * daysAgo * 24 * 60 * 60 * 1000);
  return new Date(now.getTime() - random);
}

function getRandomStatus(): 'OPEN' | 'PENDING' | 'PAID' {
  const rand = Math.random();
  if (rand < 0.05) return 'OPEN';
  if (rand < 0.30) return 'PENDING';
  return 'PAID';
}

export async function connectPlatform(platform: Platform, userId: string) {
  const startTime = Date.now();

  try {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Update or create platform connection
    const { data: existingConnection } = await supabase
      .from('platform_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', platform)
      .maybeSingle();

    if (existingConnection) {
      await supabase
        .from('platform_connections')
        .update({
          status: 'CONNECTED',
          connected_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);
    } else {
      await supabase.from('platform_connections').insert({
        user_id: userId,
        platform,
        status: 'CONNECTED',
        connected_at: new Date().toISOString(),
        last_synced_at: new Date().toISOString(),
      });
    }

    // Generate initial sales data (20-40 sales from last 30 days)
    const salesCount = Math.floor(Math.random() * 21) + 20;
    const sales = [];
    let totalRevenue = 0;

    for (let i = 0; i < salesCount; i++) {
      const product = getRandomProduct(platform);
      const commission = getRandomCommission(product.commission.min, product.commission.max);
      totalRevenue += commission;

      sales.push({
        user_id: userId,
        platform,
        sale_date: getRandomDate(30).toISOString(),
        product_name: product.name,
        brand: product.brand,
        type: 'SALE_COMMISSION',
        status: getRandomStatus(),
        commission_amount: commission,
        order_value: commission / 0.08, // Assume ~8% commission rate
      });
    }

    await supabase.from('sales').insert(sales);

    // Update product aggregates
    await updateProductAggregates(userId, platform);

    // Log the sync
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await supabase.from('sync_logs').insert({
      user_id: userId,
      platform,
      status: 'SUCCESS',
      records_synced: salesCount,
      revenue_added: totalRevenue,
      duration,
      synced_at: new Date().toISOString(),
    });

    return {
      success: true,
      salesGenerated: salesCount,
      revenueAdded: totalRevenue,
    };
  } catch (error) {
    console.error('Error connecting platform:', error);

    const duration = Math.floor((Date.now() - startTime) / 1000);
    await supabase.from('sync_logs').insert({
      user_id: userId,
      platform,
      status: 'FAILED',
      records_synced: 0,
      revenue_added: 0,
      duration,
      error: (error as Error).message,
      synced_at: new Date().toISOString(),
    });

    throw error;
  }
}

export async function syncPlatform(platform: Platform, userId: string) {
  const startTime = Date.now();

  try {
    // Set platform to syncing status
    await supabase
      .from('platform_connections')
      .update({ status: 'SYNCING' })
      .eq('user_id', userId)
      .eq('platform', platform);

    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

    // Generate new sales (5-15 from last 7 days)
    const salesCount = Math.floor(Math.random() * 11) + 5;
    const sales = [];
    let totalRevenue = 0;

    for (let i = 0; i < salesCount; i++) {
      const product = getRandomProduct(platform);
      const commission = getRandomCommission(product.commission.min, product.commission.max);
      totalRevenue += commission;

      sales.push({
        user_id: userId,
        platform,
        sale_date: getRandomDate(7).toISOString(),
        product_name: product.name,
        brand: product.brand,
        type: 'SALE_COMMISSION',
        status: getRandomStatus(),
        commission_amount: commission,
        order_value: commission / 0.08,
      });
    }

    await supabase.from('sales').insert(sales);

    // Update platform connection
    await supabase
      .from('platform_connections')
      .update({
        status: 'CONNECTED',
        last_synced_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    // Update product aggregates
    await updateProductAggregates(userId, platform);

    // Log the sync
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await supabase.from('sync_logs').insert({
      user_id: userId,
      platform,
      status: 'SUCCESS',
      records_synced: salesCount,
      revenue_added: totalRevenue,
      duration,
      synced_at: new Date().toISOString(),
    });

    return {
      success: true,
      recordsSynced: salesCount,
      revenueAdded: totalRevenue,
      lastSyncedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error syncing platform:', error);

    // Set platform back to connected with error
    await supabase
      .from('platform_connections')
      .update({ status: 'ERROR' })
      .eq('user_id', userId)
      .eq('platform', platform);

    const duration = Math.floor((Date.now() - startTime) / 1000);
    await supabase.from('sync_logs').insert({
      user_id: userId,
      platform,
      status: 'FAILED',
      records_synced: 0,
      revenue_added: 0,
      duration,
      error: (error as Error).message,
      synced_at: new Date().toISOString(),
    });

    throw error;
  }
}

export async function disconnectPlatform(platform: Platform, userId: string) {
  try {
    await supabase
      .from('platform_connections')
      .update({
        status: 'DISCONNECTED',
        last_synced_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('platform', platform);

    return { success: true };
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    throw error;
  }
}

export async function syncAllPlatforms(userId: string) {
  try {
    const { data: connections } = await supabase
      .from('platform_connections')
      .select('platform')
      .eq('user_id', userId)
      .eq('status', 'CONNECTED');

    if (!connections || connections.length === 0) {
      return { success: true, results: [] };
    }

    const results = [];
    for (const connection of connections) {
      const result = await syncPlatform(connection.platform as Platform, userId);
      results.push({
        platform: connection.platform,
        recordsSynced: result.recordsSynced,
        revenueAdded: result.revenueAdded,
      });
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error syncing all platforms:', error);
    throw error;
  }
}

async function updateProductAggregates(userId: string, platform?: Platform) {
  try {
    // Get all sales for the user (optionally filtered by platform)
    let query = supabase
      .from('sales')
      .select('product_name, brand, commission_amount, status')
      .eq('user_id', userId);

    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: sales } = await query;

    if (!sales) return;

    // Group by product
    const productMap = new Map<string, any>();
    sales.forEach((sale) => {
      const key = `${sale.product_name}-${sale.brand}`;
      if (!productMap.has(key)) {
        productMap.set(key, {
          name: sale.product_name,
          brand: sale.brand,
          totalRevenue: 0,
          totalSales: 0,
          commissions: [],
        });
      }
      const product = productMap.get(key);
      if (sale.status === 'PAID') {
        product.totalRevenue += parseFloat(sale.commission_amount);
      }
      product.totalSales += 1;
      product.commissions.push(parseFloat(sale.commission_amount));
    });

    // Update or insert products
    for (const [, productData] of productMap) {
      const avgCommission =
        productData.commissions.reduce((a: number, b: number) => a + b, 0) / productData.commissions.length;
      const conversionRate = Math.random() * 5 + 1; // 1-6%

      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('user_id', userId)
        .eq('name', productData.name)
        .eq('brand', productData.brand)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('products')
          .update({
            total_revenue: productData.totalRevenue,
            total_sales: productData.totalSales,
            avg_commission: avgCommission,
            conversion_rate: conversionRate,
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('products').insert({
          user_id: userId,
          name: productData.name,
          brand: productData.brand,
          total_revenue: productData.totalRevenue,
          total_sales: productData.totalSales,
          avg_commission: avgCommission,
          conversion_rate: conversionRate,
          total_clicks: Math.floor(productData.totalSales / (conversionRate / 100)),
        });
      }
    }
  } catch (error) {
    console.error('Error updating product aggregates:', error);
  }
}
