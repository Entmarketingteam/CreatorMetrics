import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const LTK_MIDDLEWARE_URL = 'https://ltk-auth-middleware-production.up.railway.app';

interface ImportResult {
  success: boolean;
  salesImported: number;
  productsCreated: number;
  errors: string[];
}

interface LTKConnectionStatus {
  connected: boolean;
  platform?: string;
  lastRefresh?: string;
}

export default function Import() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  // API Fetch state
  const [fetching, setFetching] = useState(false);
  const [fetchResult, setFetchResult] = useState<ImportResult | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<LTKConnectionStatus | null>(null);
  const [checkingConnection, setCheckingConnection] = useState(true);

  // Check LTK connection status on mount
  useEffect(() => {
    if (user?.id) {
      checkLTKConnection();
    } else {
      setCheckingConnection(false);
    }
  }, [user?.id]);

  const checkLTKConnection = async () => {
    if (!user?.id) return;
    setCheckingConnection(true);
    try {
      const response = await fetch(`${LTK_MIDDLEWARE_URL}/api/ltk/status/${user.id}`);
      const data = await response.json();
      setConnectionStatus(response.ok ? data : { connected: false });
    } catch (err) {
      console.error('Failed to check LTK status:', err);
      setConnectionStatus({ connected: false });
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleFetchFromLTK = async () => {
    if (!user?.id) return;

    setFetching(true);
    setFetchResult(null);

    try {
      // Call middleware to fetch earnings data
      const response = await fetch(`${LTK_MIDDLEWARE_URL}/api/ltk/earnings/${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to fetch LTK data');
      }

      if (!data.earnings || data.earnings.length === 0) {
        setFetchResult({
          success: true,
          salesImported: 0,
          productsCreated: 0,
          errors: ['No earnings data found. You may not have any recent sales.']
        });
        return;
      }

      // Process the earnings data
      const salesData: any[] = [];
      const productMap = new Map<string, any>();

      for (const earning of data.earnings) {
        const commission = parseFloat(earning.commission) || 0;
        if (commission === 0) continue;

        const productKey = `${earning.brand}:${earning.product}`;

        salesData.push({
          user_id: user.id,
          platform: 'LTK',
          sale_date: earning.date || new Date().toISOString(),
          product_name: earning.product || 'Unknown Product',
          brand: earning.brand || 'Unknown Brand',
          type: 'SALE_COMMISSION',
          status: mapStatus(earning.status || 'PENDING'),
          commission_amount: commission,
          order_value: parseFloat(earning.orderValue) || null,
        });

        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            user_id: user.id,
            name: earning.product || 'Unknown Product',
            brand: earning.brand || 'Unknown Brand',
            total_revenue: 0,
            total_sales: 0,
            avg_commission: 0,
          });
        }

        const product = productMap.get(productKey);
        product.total_revenue += commission;
        product.total_sales += 1;
      }

      // Calculate averages
      for (const product of productMap.values()) {
        product.avg_commission = product.total_sales > 0
          ? product.total_revenue / product.total_sales
          : 0;
      }

      // Insert sales
      if (salesData.length > 0) {
        const { error: salesError } = await supabase
          .from('sales')
          .insert(salesData);

        if (salesError) throw salesError;
      }

      // Process products
      const productsArray = Array.from(productMap.values());
      const productErrors: string[] = [];

      for (const product of productsArray) {
        const { data: existing, error: selectError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .eq('name', product.name)
          .eq('brand', product.brand)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          productErrors.push(`Error checking product ${product.name}: ${selectError.message}`);
          continue;
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              total_revenue: existing.total_revenue + product.total_revenue,
              total_sales: existing.total_sales + product.total_sales,
              avg_commission: (existing.total_revenue + product.total_revenue) /
                            (existing.total_sales + product.total_sales)
            })
            .eq('id', existing.id);

          if (updateError) {
            productErrors.push(`Error updating product ${product.name}: ${updateError.message}`);
          }
        } else {
          const { error: insertError } = await supabase
            .from('products')
            .insert(product);

          if (insertError) {
            productErrors.push(`Error creating product ${product.name}: ${insertError.message}`);
          }
        }
      }

      setFetchResult({
        success: true,
        salesImported: salesData.length,
        productsCreated: productsArray.length - productErrors.length,
        errors: productErrors
      });

    } catch (error: any) {
      setFetchResult({
        success: false,
        salesImported: 0,
        productsCreated: 0,
        errors: [error.message || 'An error occurred while fetching LTK data']
      });
    } finally {
      setFetching(false);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;

      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const parseCommission = (commissionStr: string): number => {
    const cleaned = commissionStr.replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const parseDate = (dateStr: string): string => {
    const [month, day, year] = dateStr.split('/');
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  const mapStatus = (ltkStatus: string): string => {
    const normalized = ltkStatus.trim().toLowerCase();
    switch (normalized) {
      case 'open':
        return 'OPEN';
      case 'pending':
        return 'PENDING';
      case 'paid':
        return 'PAID';
      case 'reversed':
        return 'REVERSED';
      default:
        return 'PENDING';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setImporting(true);
    setResult(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      const salesData: any[] = [];
      const productMap = new Map<string, any>();

      for (const row of rows) {
        if (!row.Date || !row.Commission) continue;

        const commission = parseCommission(row.Commission);
        if (commission === 0) continue;

        const saleDate = parseDate(row.Date);
        const productKey = `${row.Brand}:${row.Product}`;

        salesData.push({
          user_id: user.id,
          platform: 'LTK',
          sale_date: saleDate,
          product_name: row.Product || 'Unknown Product',
          brand: row.Brand || 'Unknown Brand',
          type: 'SALE_COMMISSION',
          status: mapStatus(row.Status || 'PENDING'),
          commission_amount: commission,
        });

        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            user_id: user.id,
            name: row.Product || 'Unknown Product',
            brand: row.Brand || 'Unknown Brand',
            total_revenue: 0,
            total_sales: 0,
            avg_commission: 0,
            platform_links: JSON.stringify([{
              platform: 'LTK',
              url: row['Direct to retailer link'] || ''
            }])
          });
        }

        const product = productMap.get(productKey);
        product.total_revenue += commission;
        product.total_sales += 1;
      }

      for (const product of productMap.values()) {
        product.avg_commission = product.total_sales > 0
          ? product.total_revenue / product.total_sales
          : 0;
      }

      const { error: salesError } = await supabase
        .from('sales')
        .insert(salesData);

      if (salesError) throw salesError;

      const productsArray = Array.from(productMap.values());
      const productErrors: string[] = [];

      for (const product of productsArray) {
        const { data: existing, error: selectError } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id)
          .eq('name', product.name)
          .eq('brand', product.brand)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          productErrors.push(`Error checking product ${product.name}: ${selectError.message}`);
          continue;
        }

        if (existing) {
          const { error: updateError } = await supabase
            .from('products')
            .update({
              total_revenue: existing.total_revenue + product.total_revenue,
              total_sales: existing.total_sales + product.total_sales,
              avg_commission: (existing.total_revenue + product.total_revenue) /
                            (existing.total_sales + product.total_sales)
            })
            .eq('id', existing.id);

          if (updateError) {
            productErrors.push(`Error updating product ${product.name}: ${updateError.message}`);
          }
        } else {
          const { error: insertError } = await supabase
            .from('products')
            .insert(product);

          if (insertError) {
            productErrors.push(`Error creating product ${product.name}: ${insertError.message}`);
          }
        }
      }

      if (productErrors.length > 0 && productErrors.length === productsArray.length) {
        throw new Error(`All product operations failed: ${productErrors.join('; ')}`);
      }

      setResult({
        success: true,
        salesImported: salesData.length,
        productsCreated: productsArray.length - productErrors.length,
        errors: productErrors
      });
    } catch (error: any) {
      setResult({
        success: false,
        salesImported: 0,
        productsCreated: 0,
        errors: [error.message || 'An error occurred during import']
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Import LTK Data
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Fetch your earnings automatically or upload CSV files
        </p>
      </div>

      {/* Auto-Fetch Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Download className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Fetch from LTK API
          </h2>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
            Recommended
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Automatically fetch your latest earnings data directly from LTK using your connected account.
        </p>

        {checkingConnection ? (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking connection...
          </div>
        ) : connectionStatus?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">LTK Connected</span>
            </div>

            <button
              onClick={handleFetchFromLTK}
              disabled={fetching}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {fetching ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Fetching from LTK...
                </>
              ) : (
                <>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Fetch Latest Earnings
                </>
              )}
            </button>

            {fetching && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-md p-4">
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  Fetching your earnings data from LTK. This may take a moment...
                </p>
              </div>
            )}

            {fetchResult && (
              <div className={`rounded-md p-4 ${
                fetchResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
              }`}>
                <div className="flex">
                  {fetchResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div className="ml-3">
                    <h3 className={`text-sm font-medium ${
                      fetchResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {fetchResult.success ? 'Fetch Successful' : 'Fetch Failed'}
                    </h3>
                    {fetchResult.success && fetchResult.salesImported > 0 && (
                      <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                        <ul className="list-disc list-inside space-y-1">
                          <li>{fetchResult.salesImported} sales imported</li>
                          <li>{fetchResult.productsCreated} products processed</li>
                        </ul>
                      </div>
                    )}
                    {fetchResult.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                        <ul className="list-disc list-inside space-y-1">
                          {fetchResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                  LTK Not Connected
                </p>
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                  Connect your LTK account on the{' '}
                  <a href="/platforms" className="underline hover:text-yellow-800 dark:hover:text-yellow-200">
                    Platforms page
                  </a>{' '}
                  to fetch data automatically.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSV Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Upload CSV File
          </h2>
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
            Manual
          </span>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Alternatively, upload your LTK earnings export CSV file.
        </p>

        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <div className="text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                data-testid="button-select-file"
              >
                <Upload className="h-5 w-5 mr-2" />
                Select CSV File
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
                data-testid="input-file-upload"
              />
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400" data-testid="text-selected-file">
                Selected: {file.name}
              </p>
            )}
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              CSV files from LTK earnings exports
            </p>
          </div>
        </div>

        {file && (
          <div className="mt-6">
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-import"
            >
              {importing ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Import Data
                </>
              )}
            </button>
          </div>
        )}

        {result && (
          <div className={`mt-6 rounded-md p-4 ${
            result.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400" />
              )}
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${
                  result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`} data-testid="text-import-status">
                  {result.success ? 'Import Successful' : 'Import Failed'}
                </h3>
                {result.success && (
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                    <ul className="list-disc list-inside space-y-1">
                      <li data-testid="text-sales-imported">{result.salesImported} sales imported</li>
                      <li data-testid="text-products-created">{result.productsCreated} products processed</li>
                    </ul>
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index} data-testid={`text-error-${index}`}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            CSV Import Instructions
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
            <li>Download your earnings export from LTK</li>
            <li>Select the CSV file using the button above</li>
            <li>Click "Import Data" to process the file</li>
            <li>Sales will be added to your earnings data</li>
            <li>Products will be created or updated automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
