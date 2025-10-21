export interface Sale {
  id: string;
  date: string;
  platform: 'LTK' | 'Amazon' | 'Walmart' | 'ShopStyle';
  product: string;
  brand: string;
  type: 'SALE_COMMISSION' | 'CLICK_COMMISSION' | 'BONUS';
  status: 'Paid' | 'Pending' | 'Open';
  amount: number;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  imageUrl: string;
  totalRevenue: number;
  totalSales: number;
  totalClicks: number;
  conversionRate: number;
  platform: string;
  trend: number;
}

export interface RevenueByPlatform {
  platform: string;
  revenue: number;
  percentage: number;
  color: string;
}

export interface RevenueOverTime {
  date: string;
  revenue: number;
}

export interface RecentActivity {
  id: string;
  timeAgo: string;
  platform: 'LTK' | 'Amazon' | 'Walmart' | 'ShopStyle';
  productName: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Open';
}

const brands = [
  'Lululemon', 'Nike', 'Adidas', 'Stanley', 'Dyson', 'Apple', 'Samsung',
  'Outdoor Voices', 'Alo Yoga', 'Athleta', 'Free People', 'Zella',
  'Hydro Flask', 'YETI', 'Vitamix', 'KitchenAid', 'Le Creuset',
  'Barefoot Dreams', 'Ugg', 'Spanx', 'Skims', 'Good American'
];

const products = [
  'Align Leggings', 'Running Shoes', 'Sports Bra', 'Water Bottle',
  'Yoga Mat', 'Hair Dryer', 'Vacuum Cleaner', 'Blender', 'Air Fryer',
  'Throw Blanket', 'Slippers', 'Hoodie', 'Workout Set', 'Tank Top',
  'Coffee Maker', 'Kitchen Mixer', 'Wireless Earbuds', 'Phone Case',
  'Jeans', 'Dress', 'Sweater', 'Coat', 'Sneakers', 'Backpack'
];

const categories = [
  'Activewear', 'Footwear', 'Beauty', 'Home', 'Kitchen', 'Electronics',
  'Accessories', 'Outerwear', 'Loungewear', 'Fitness'
];

function generateRandomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0];
}

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSales(count: number): Sale[] {
  const sales: Sale[] = [];
  const platforms: ('LTK' | 'Amazon' | 'Walmart' | 'ShopStyle')[] = ['LTK', 'Amazon', 'Walmart', 'ShopStyle'];
  const types: ('SALE_COMMISSION' | 'CLICK_COMMISSION' | 'BONUS')[] = ['SALE_COMMISSION', 'CLICK_COMMISSION', 'BONUS'];
  const statuses: ('Paid' | 'Pending' | 'Open')[] = ['Paid', 'Pending', 'Open'];

  for (let i = 0; i < count; i++) {
    const platform = getRandomElement(platforms);
    let amount: number;

    switch (platform) {
      case 'LTK':
        amount = Math.random() * 100 + 20;
        break;
      case 'Amazon':
        amount = Math.random() * 50 + 10;
        break;
      case 'Walmart':
        amount = Math.random() * 40 + 5;
        break;
      case 'ShopStyle':
        amount = Math.random() * 60 + 15;
        break;
    }

    sales.push({
      id: `sale-${i}`,
      date: generateRandomDate(90),
      platform,
      product: `${getRandomElement(brands)} ${getRandomElement(products)}`,
      brand: getRandomElement(brands),
      type: getRandomElement(types),
      status: getRandomElement(statuses),
      amount: Number(amount.toFixed(2))
    });
  }

  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateProducts(count: number): Product[] {
  const productsData: Product[] = [];
  const platforms = ['LTK', 'Amazon', 'Walmart', 'ShopStyle'];

  for (let i = 0; i < count; i++) {
    const totalSales = Math.floor(Math.random() * 50) + 1;
    const totalClicks = Math.floor(totalSales * (Math.random() * 20 + 5));
    const conversionRate = (totalSales / totalClicks) * 100;
    const avgPrice = Math.random() * 100 + 20;
    const totalRevenue = totalSales * avgPrice;

    productsData.push({
      id: `product-${i}`,
      name: `${getRandomElement(brands)} ${getRandomElement(products)}`,
      brand: getRandomElement(brands),
      category: getRandomElement(categories),
      imageUrl: `https://images.pexels.com/photos/${1000000 + i}/pexels-photo-${1000000 + i}.jpeg?auto=compress&cs=tinysrgb&w=400`,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalSales,
      totalClicks,
      conversionRate: Number(conversionRate.toFixed(2)),
      platform: getRandomElement(platforms),
      trend: Math.random() * 100 - 20
    });
  }

  return productsData.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

function generateRevenueByPlatform(): RevenueByPlatform[] {
  return [
    { platform: 'LTK', revenue: 6200, percentage: 50, color: '#8b5cf6' },
    { platform: 'Amazon', revenue: 4100, percentage: 33, color: '#f97316' },
    { platform: 'Walmart', revenue: 1500, percentage: 12, color: '#3b82f6' },
    { platform: 'ShopStyle', revenue: 600, percentage: 5, color: '#ec4899' }
  ];
}

function generateRevenueOverTime(): RevenueOverTime[] {
  const data: RevenueOverTime[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const baseRevenue = 350;
    const variance = Math.random() * 200 - 50;
    const weekendBonus = date.getDay() === 0 || date.getDay() === 6 ? 100 : 0;

    data.push({
      date: date.toISOString().split('T')[0],
      revenue: Number((baseRevenue + variance + weekendBonus).toFixed(2))
    });
  }

  return data;
}

function generateRecentActivity(): RecentActivity[] {
  const activities: RecentActivity[] = [];
  const timeAgos = [
    '2 hours ago', '5 hours ago', '8 hours ago', '12 hours ago',
    '1 day ago', '1 day ago', '2 days ago', '2 days ago',
    '3 days ago', '4 days ago'
  ];
  const platforms: ('LTK' | 'Amazon' | 'Walmart' | 'ShopStyle')[] = ['LTK', 'Amazon', 'Walmart', 'ShopStyle'];
  const statuses: ('Paid' | 'Pending' | 'Open')[] = ['Paid', 'Pending', 'Open'];

  for (let i = 0; i < 10; i++) {
    const platform = getRandomElement(platforms);
    let amount: number;

    switch (platform) {
      case 'LTK':
        amount = Math.random() * 80 + 15;
        break;
      case 'Amazon':
        amount = Math.random() * 40 + 8;
        break;
      case 'Walmart':
        amount = Math.random() * 30 + 5;
        break;
      case 'ShopStyle':
        amount = Math.random() * 50 + 12;
        break;
    }

    activities.push({
      id: `activity-${i}`,
      timeAgo: timeAgos[i],
      platform,
      productName: `${getRandomElement(brands)} ${getRandomElement(products)}`,
      amount: Number(amount.toFixed(2)),
      status: getRandomElement(statuses)
    });
  }

  return activities;
}

export const mockSales = generateSales(100);
export const mockProducts = generateProducts(35);
export const mockRevenueByPlatform = generateRevenueByPlatform();
export const mockRevenueOverTime = generateRevenueOverTime();
export const mockRecentActivity = generateRecentActivity();

export const mockTopProducts = mockProducts.slice(0, 5).map(p => ({
  id: p.id,
  name: p.name,
  platform: p.platform,
  sales: p.totalSales,
  revenue: p.totalRevenue,
  trend: p.trend
}));
