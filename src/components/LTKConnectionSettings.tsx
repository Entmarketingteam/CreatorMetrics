import { useState, useEffect } from 'react';
import { ltkApi, LTKCredentials } from '../services/ltkApi';
import { ltkTokenManager } from '../services/ltkTokenManager';
import { ltkRefreshScheduler } from '../services/ltkRefreshScheduler';

export default function LTKConnectionSettings() {
  const [tokenType, setTokenType] = useState<'bearer' | 'cookie' | 'api_key'>('bearer');
  const [tokenValue, setTokenValue] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [refreshStatus, setRefreshStatus] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState(15);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    loadConnectionStatus();
    loadRefreshStatus();

    // Update refresh status every 5 seconds
    const interval = setInterval(loadRefreshStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConnectionStatus = async () => {
    const meta = await ltkTokenManager.getMetadata();
    setMetadata(meta);
    setIsConnected(meta.hasCredentials && !meta.isExpired);
  };

  const loadRefreshStatus = () => {
    const status = ltkRefreshScheduler.getStatus();
    setRefreshStatus(status);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate format first
      const validation = ltkTokenManager.validateCredentialsFormat({
        type: tokenType,
        value: tokenValue,
      });

      if (!validation.valid) {
        setError(validation.error || 'Invalid credentials format');
        setIsTesting(false);
        return;
      }

      // Set credentials temporarily
      ltkApi.setCredentials({
        type: tokenType,
        value: tokenValue,
      });

      // Test connection
      const result = await ltkApi.testConnection();

      if (result.success) {
        setSuccess('Connection successful! Token is valid.');
      } else {
        setError(result.error || 'Connection failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate format
      const validation = ltkTokenManager.validateCredentialsFormat({
        type: tokenType,
        value: tokenValue,
      });

      if (!validation.valid) {
        setError(validation.error || 'Invalid credentials format');
        setIsSaving(false);
        return;
      }

      // Store credentials
      await ltkTokenManager.storeCredentials({
        type: tokenType,
        value: tokenValue,
      });

      // Set in API service
      ltkApi.setCredentials({
        type: tokenType,
        value: tokenValue,
      });

      // Start auto-refresh
      await ltkRefreshScheduler.start({
        intervalMinutes: refreshInterval,
        onError: (err) => {
          console.error('Refresh error:', err);
        },
        onTokenExpired: () => {
          setIsConnected(false);
          setError('Token expired. Please enter a new token.');
        },
      });

      setSuccess('Connection saved! Auto-refresh is now active.');
      setIsConnected(true);
      setTokenValue(''); // Clear input for security
      await loadConnectionStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save connection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await ltkTokenManager.clearCredentials();
      ltkApi.clearCredentials();
      ltkRefreshScheduler.stop();
      setIsConnected(false);
      setMetadata(null);
      setSuccess('Disconnected from LTK');
      await loadConnectionStatus();
    } catch (err) {
      setError('Failed to disconnect');
    }
  };

  const handleForceRefresh = async () => {
    setError(null);
    setSuccess(null);

    try {
      const result = await ltkRefreshScheduler.forceRefresh();
      if (result.success) {
        setSuccess('Data refreshed successfully!');
        loadRefreshStatus();
      } else {
        setError(result.error || 'Refresh failed');
      }
    } catch (err) {
      setError('Failed to refresh data');
    }
  };

  const handleUpdateInterval = async () => {
    try {
      ltkRefreshScheduler.setInterval(refreshInterval);
      setSuccess(`Refresh interval updated to ${refreshInterval} minutes`);
      loadRefreshStatus();
    } catch (err) {
      setError('Failed to update interval');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeUntilNextRefresh = () => {
    if (!refreshStatus?.nextRefresh) return 'N/A';

    const now = new Date().getTime();
    const next = new Date(refreshStatus.nextRefresh).getTime();
    const diffMinutes = Math.round((next - now) / 60000);

    if (diffMinutes < 0) return 'Overdue';
    if (diffMinutes === 0) return 'Less than a minute';
    if (diffMinutes === 1) return '1 minute';
    return `${diffMinutes} minutes`;
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">LTK Connection</h2>
          {isConnected && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
            </div>
          )}
        </div>

        {metadata?.hasCredentials && (
          <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">{metadata.type}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Created:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formatDate(metadata.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Last Validated:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {formatDate(metadata.lastValidated)}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <span className={`ml-2 font-medium ${metadata.isExpired ? 'text-red-600' : 'text-green-600'}`}>
                {metadata.isExpired ? 'Expired' : 'Active'}
              </span>
            </div>
          </div>
        )}

        {!isConnected && (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Connect your LTK account to automatically sync your stats and earnings.
            </p>

            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-4 hover:underline"
            >
              {showGuide ? '− Hide' : '+ Show'} extraction guide
            </button>

            {showGuide && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 text-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">How to Extract Your LTK Token:</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  <li>Log into your LTK creator dashboard</li>
                  <li>Open Chrome DevTools (F12 or Right-click → Inspect)</li>
                  <li>Go to the "Network" tab and filter by "Fetch/XHR"</li>
                  <li>Navigate around your LTK dashboard</li>
                  <li>Click on any API request and look for "Authorization" header or tokens in the response</li>
                  <li>Copy the token value (usually starts with "eyJ" for Bearer tokens)</li>
                </ol>
                <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  See full guide in docs/LTK_TOKEN_EXTRACTION_GUIDE.md
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Type
                </label>
                <select
                  value={tokenType}
                  onChange={(e) => setTokenType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="bearer">Bearer Token (JWT)</option>
                  <option value="cookie">Cookie</option>
                  <option value="api_key">API Key</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Token Value
                </label>
                <textarea
                  value={tokenValue}
                  onChange={(e) => setTokenValue(e.target.value)}
                  placeholder="Paste your token here..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
                  {success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleTestConnection}
                  disabled={!tokenValue || isTesting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleSaveConnection}
                  disabled={!tokenValue || isSaving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Saving...' : 'Save & Connect'}
                </button>
              </div>
            </div>
          </>
        )}

        {isConnected && (
          <button
            onClick={handleDisconnect}
            className="w-full px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            Disconnect LTK
          </button>
        )}
      </div>

      {/* Auto-Refresh Settings */}
      {isConnected && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Auto-Refresh</h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`ml-2 font-medium ${refreshStatus?.isRunning ? 'text-green-600' : 'text-gray-600'}`}>
                  {refreshStatus?.isRunning ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Last Refresh:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {formatDate(refreshStatus?.lastRefresh)}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Next Refresh:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {getTimeUntilNextRefresh()}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Errors:</span>
                <span className={`ml-2 font-medium ${refreshStatus?.consecutiveErrors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {refreshStatus?.consecutiveErrors || 0}
                </span>
              </div>
            </div>

            {refreshStatus?.lastError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                Last Error: {refreshStatus.lastError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Refresh Interval (minutes)
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 15)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleUpdateInterval}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recommended: 15-30 minutes to avoid rate limiting
              </p>
            </div>

            <button
              onClick={handleForceRefresh}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Force Refresh Now
            </button>

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-sm text-green-800 dark:text-green-200">
                {success}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
