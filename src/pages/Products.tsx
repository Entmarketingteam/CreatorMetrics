import { useState, useMemo } from 'react';
import { Search, Grid3x3, List, TrendingUp, TrendingDown } from 'lucide-react';
import { mockProducts } from '../data/mockData';

type ViewMode = 'grid' | 'table';
type SortKey = 'totalRevenue' | 'totalSales' | 'conversionRate';

export default function Products() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortKey>('totalRevenue');

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = mockProducts.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPlatform = platformFilter === 'All' || product.platform === platformFilter;
      return matchesSearch && matchesPlatform;
    });

    return filtered.sort((a, b) => b[sortBy] - a[sortBy]);
  }, [searchTerm, platformFilter, sortBy]);

  const getPlatformColor = (platform: string) => {
    const colors = {
      LTK: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
      Amazon: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
      Walmart: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
      ShopStyle: 'bg-pink-100 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400'
    };
    return colors[platform as keyof typeof colors] || colors.LTK;
  };

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Analyze performance of your promoted products.</p>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 w-full overflow-hidden">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="totalRevenue">Sort by Revenue</option>
              <option value="totalSales">Sort by Sales</option>
              <option value="conversionRate">Sort by Conversion</option>
            </select>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                aria-label="Grid view"
              >
                <Grid3x3 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
                aria-label="Table view"
              >
                <List className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedProducts.length} products
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredAndSortedProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400';
                  }}
                />
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(product.platform)}`}>
                  {product.platform}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{product.brand}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Revenue</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      ${product.totalRevenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Sales</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {product.totalSales}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Conversion</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {product.conversionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <button className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-full">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[900px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Brand
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Category
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Platform
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Revenue
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Sales
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Clicks
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Conv. Rate
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">
                    Trend
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=100';
                          }}
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.brand}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {product.category}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(product.platform)}`}>
                        {product.platform}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-gray-900 dark:text-white text-right">
                      ${product.totalRevenue.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-center">
                      {product.totalSales}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 text-center">
                      {product.totalClicks}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white text-center">
                      {product.conversionRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <div className={`flex items-center justify-center gap-1 text-sm font-medium ${
                        product.trend > 0 ? 'text-green-600 dark:text-green-400' :
                        product.trend < 0 ? 'text-red-600 dark:text-red-400' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        {product.trend > 0 ? <TrendingUp className="w-4 h-4" /> :
                         product.trend < 0 ? <TrendingDown className="w-4 h-4" /> :
                         <span>→</span>}
                        {product.trend !== 0 && `${Math.abs(product.trend).toFixed(0)}%`}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
