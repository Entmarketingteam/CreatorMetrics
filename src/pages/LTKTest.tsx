import { useState } from 'react';
import { LTKApiClient } from '../lib/ltkApiClient';
import { Loader2, CheckCircle2, XCircle, Copy } from 'lucide-react';

interface TestResult {
  endpoint: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

export default function LTKTest() {
  const [token, setToken] = useState('');
  const [accountId, setAccountId] = useState('278632');
  const [publisherId, setPublisherId] = useState('293045');
  const [results, setResults] = useState<Map<string, TestResult>>(new Map());
  const [isTestingAll, setIsTestingAll] = useState(false);

  const updateResult = (key: string, result: Partial<TestResult>) => {
    setResults(prev => new Map(prev).set(key, { ...prev.get(key), ...result } as TestResult));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const testEndpoint = async (
    key: string,
    name: string,
    testFn: (client: LTKApiClient) => Promise<any>
  ) => {
    updateResult(key, { endpoint: name, status: 'pending' });
    const startTime = performance.now();

    try {
      const client = new LTKApiClient(() => token);
      const data = await testFn(client);
      const duration = performance.now() - startTime;
      
      updateResult(key, {
        status: 'success',
        data,
        duration
      });
    } catch (error: any) {
      const duration = performance.now() - startTime;
      updateResult(key, {
        status: 'error',
        error: error.message,
        duration
      });
    }
  };

  const testAllEndpoints = async () => {
    if (!token) {
      alert('Please enter your Auth0 ID token first');
      return;
    }

    setIsTestingAll(true);
    setResults(new Map());

    const tests = [
      // Analytics
      { key: 'contributors', name: 'Get Contributors', fn: (c: LTKApiClient) => c.getContributors() },
      { key: 'heroChart', name: 'Get Hero Chart', fn: (c: LTKApiClient) => c.getHeroChart({
        start_date: '2025-10-01T00:00:00Z',
        end_date: '2025-10-07T23:59:59Z',
        publisher_ids: publisherId,
        interval: 'day',
        platform: 'rs,ltk'
      })},
      { key: 'perfSummary', name: 'Get Performance Summary', fn: (c: LTKApiClient) => c.getPerformanceSummary({
        start_date: '2025-10-01T00:00:00Z',
        end_date: '2025-10-07T23:59:59Z',
        publisher_ids: publisherId,
        platform: 'rs,ltk'
      })},
      { key: 'perfStats', name: 'Get Performance Stats', fn: (c: LTKApiClient) => c.getPerformanceStats({
        start: '2025-10-01T00:00:00Z',
        end: '2025-10-07T23:59:59Z'
      })},
      { key: 'topPerformers', name: 'Get Top Performers', fn: (c: LTKApiClient) => c.getTopPerformers({
        start_date: '2025-10-01T00:00:00Z',
        end_date: '2025-10-07T23:59:59Z',
        publisher_ids: publisherId,
        platform: 'rs,ltk',
        limit: 10
      })},
      { key: 'itemsSold', name: 'Get Items Sold', fn: (c: LTKApiClient) => c.getItemsSold({ limit: 10 })},
      { key: 'commissions', name: 'Get Commissions Summary', fn: (c: LTKApiClient) => c.getCommissionsSummary()},
      
      // User & Account
      { key: 'user', name: 'Get User', fn: (c: LTKApiClient) => c.getUser(parseInt(publisherId))},
      { key: 'account', name: 'Get Account', fn: (c: LTKApiClient) => c.getAccount(parseInt(accountId))},
      { key: 'accountUsers', name: 'Get Account Users', fn: (c: LTKApiClient) => c.getAccountUsers(parseInt(accountId))},
      { key: 'userInfo', name: 'Get User Info', fn: (c: LTKApiClient) => c.getUserInfo()},
      { key: 'publicProfile', name: 'Get Public Profile', fn: (c: LTKApiClient) => c.getPublicProfile(parseInt(accountId))},
      
      // Integrations
      { key: 'amazonIds', name: 'Get Amazon Identities', fn: (c: LTKApiClient) => c.getAmazonIdentities()},
      { key: 'searchTrends', name: 'Get LTK Search Trends', fn: (c: LTKApiClient) => c.getLTKSearchTrends()},
    ];

    for (const test of tests) {
      await testEndpoint(test.key, test.name, test.fn);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsTestingAll(false);
  };

  const decodeToken = () => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  };

  const tokenPayload = decodeToken();
  const isTokenValid = tokenPayload && tokenPayload.exp > Date.now() / 1000;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold mb-2">LTK API Test</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test all 14 LTK API endpoints with your Auth0 token
        </p>
      </div>

      {/* Token Input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Auth0 ID Token</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Get your token from creator.shopltk.com cookies (auth._id_token.auth0)
        </p>
        
        <div className="space-y-2">
          <label htmlFor="token" className="block text-sm font-medium">
            ID Token (JWT)
          </label>
          <textarea
            id="token"
            placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIs..."
            value={token}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setToken(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border rounded-md font-mono text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-600"
            data-testid="input-token"
          />
        </div>

        {tokenPayload && (
          <div className="space-y-3 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${isTokenValid ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {isTokenValid ? 'Valid' : 'Expired'}
              </span>
              {tokenPayload.exp && (
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Expires: {new Date(tokenPayload.exp * 1000).toLocaleString()}
                </span>
              )}
            </div>
            
            {tokenPayload['http://shopltk.com/profile'] && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Account ID:</span>{' '}
                  {tokenPayload['http://shopltk.com/profile'].account_id}
                </div>
                <div>
                  <span className="font-medium">Publisher ID:</span>{' '}
                  {tokenPayload['http://shopltk.com/profile'].publisher_id}
                </div>
                {tokenPayload['http://shopltk.com/profile'].publisher_name && (
                  <div className="col-span-2">
                    <span className="font-medium">Name:</span>{' '}
                    {tokenPayload['http://shopltk.com/profile'].publisher_name}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="accountId" className="block text-sm font-medium">
              Account ID
            </label>
            <input
              type="text"
              id="accountId"
              value={accountId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAccountId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
              data-testid="input-account-id"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="publisherId" className="block text-sm font-medium">
              Publisher ID
            </label>
            <input
              type="text"
              id="publisherId"
              value={publisherId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPublisherId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-600"
              data-testid="input-publisher-id"
            />
          </div>
        </div>

        <button
          onClick={testAllEndpoints}
          disabled={!token || !isTokenValid || isTestingAll}
          className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          data-testid="button-test-all"
        >
          {isTestingAll ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Testing All Endpoints...
            </>
          ) : (
            'Test All Endpoints'
          )}
        </button>
      </div>

      {/* Results */}
      {results.size > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Test Results</h2>
          
          {Array.from(results.entries()).map(([key, result]) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {result.status === 'pending' && (
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                  )}
                  {result.status === 'success' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  {result.status === 'error' && (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <h3 className="font-semibold text-lg">{result.endpoint}</h3>
                </div>
                {result.duration && (
                  <span className="text-sm text-gray-500 px-2 py-1 border rounded">
                    {result.duration.toFixed(0)}ms
                  </span>
                )}
              </div>

              {result.status === 'success' && result.data && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response:</span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      data-testid={`button-copy-${key}`}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto max-h-96">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              {result.status === 'error' && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded text-sm">
                  {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">How to Get Your Token</h2>
        <div className="space-y-3 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>
              Go to{' '}
              <a href="https://creator.shopltk.com" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">
                creator.shopltk.com
              </a>{' '}
              and log in
            </li>
            <li>Open Chrome DevTools (F12) → Console tab</li>
            <li>Run this code:</li>
          </ol>
          
          <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-auto">
{`document.cookie
  .split('; ')
  .find(row => row.startsWith('auth._id_token.auth0='))
  ?.split('=')[1]`}
          </pre>
          
          <p>4. Copy the output and paste it above</p>
          <p className="text-gray-600 dark:text-gray-400">
            Token expires after ~28 hours. You'll need to get a fresh one if it expires.
          </p>
        </div>
      </div>
    </div>
  );
}
