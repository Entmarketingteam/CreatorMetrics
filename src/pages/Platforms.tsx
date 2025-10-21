import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RefreshCw, Link2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { connectPlatform, syncPlatform, disconnectPlatform, syncAllPlatforms, Platform } from '../services/platformService';
import toast, { Toaster } from 'react-hot-toast';

interface PlatformConnection {
  id: string;
  platform: Platform;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';
  connected_at: string | null;
  last_synced_at: string | null;
  stats?: {
    revenue: number;
    sales: number;
    last7Days: number;
  };
}

interface SyncLog {
  id: string;
  platform: string;
  status: string;
  records_synced: number;
  revenue_added: number;
  duration: number;
  error: string | null;
  synced_at: string;
}

const platformInfo = {
  LTK: { name: 'LTK', color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
  AMAZON: { name: 'Amazon', color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' },
  WALMART: { name: 'Walmart', color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
  SHOPSTYLE: { name: 'ShopStyle', color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400' },
};

export default function Platforms() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [syncingAll, setSyncingAll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConnections();
      fetchSyncLogs();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      // Fetch stats for each connected platform
      const connectionsWithStats = await Promise.all(
        (data || []).map(async (conn) => {
          if (conn.status === 'CONNECTED') {
            const { data: sales } = await supabase
              .from('sales')
              .select('commission_amount, sale_date, status')
              .eq('user_id', user.id)
              .eq('platform', conn.platform);

            const paidSales = sales?.filter(s => s.status === 'PAID') || [];
            const revenue = paidSales.reduce((sum, s) => sum + parseFloat(s.commission_amount), 0);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const last7Days = paidSales
              .filter(s => new Date(s.sale_date) >= sevenDaysAgo)
              .reduce((sum, s) => sum + parseFloat(s.commission_amount), 0);

            return {
              ...conn,
              stats: {
                revenue,
                sales: sales?.length || 0,
                last7Days,
              },
            };
          }
          return conn;
        })
      );

      setConnections(connectionsWithStats);
    } catch (error) {
      console.error('Error fetching connections:', error);
      toast.error('Failed to load platform connections');
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncLogs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sync_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('synced_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSyncLogs(data || []);
    } catch (error) {
      console.error('Error fetching sync logs:', error);
    }
  };

  const handleConnect = async () => {
    if (!selectedPlatform || !user) return;

    setConnecting(true);
    try {
      const result = await connectPlatform(selectedPlatform, user.id);
      toast.success(`Successfully connected ${platformInfo[selectedPlatform].name}! Imported ${result.salesGenerated} sales totaling $${result.revenueAdded.toFixed(2)}`);
      setConnectModalOpen(false);
      setSelectedPlatform(null);
      await fetchConnections();
      await fetchSyncLogs();
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast.error(`Failed to connect ${platformInfo[selectedPlatform].name}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleSync = async (platform: Platform) => {
    if (!user) return;

    setSyncing(prev => ({ ...prev, [platform]: true }));
    try {
      const result = await syncPlatform(platform, user.id);
      toast.success(`Synced ${platformInfo[platform].name}! Found ${result.recordsSynced} new sales totaling $${result.revenueAdded.toFixed(2)}`);
      await fetchConnections();
      await fetchSyncLogs();
    } catch (error) {
      console.error('Error syncing platform:', error);
      toast.error(`Failed to sync ${platformInfo[platform].name}`);
    } finally {
      setSyncing(prev => ({ ...prev, [platform]: false }));
    }
  };

  const handleDisconnect = async () => {
    if (!selectedPlatform || !user) return;

    try {
      await disconnectPlatform(selectedPlatform, user.id);
      toast.success(`${platformInfo[selectedPlatform].name} has been disconnected`);
      setDisconnectModalOpen(false);
      setSelectedPlatform(null);
      await fetchConnections();
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      toast.error(`Failed to disconnect ${platformInfo[selectedPlatform].name}`);
    }
  };

  const handleSyncAll = async () => {
    if (!user) return;

    setSyncingAll(true);
    try {
      const result = await syncAllPlatforms(user.id);
      const totalRecords = result.results.reduce((sum, r) => sum + r.recordsSynced, 0);
      const totalRevenue = result.results.reduce((sum, r) => sum + r.revenueAdded, 0);
      toast.success(`Synced all platforms! Found ${totalRecords} new sales totaling $${totalRevenue.toFixed(2)}`);
      await fetchConnections();
      await fetchSyncLogs();
    } catch (error) {
      console.error('Error syncing all platforms:', error);
      toast.error('Failed to sync all platforms');
    } finally {
      setSyncingAll(false);
    }
  };

  const getConnection = (platform: Platform) => {
    return connections.find(c => c.platform === platform);
  };

  const formatTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const connectedCount = connections.filter(c => c.status === 'CONNECTED').length;

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <Toaster position="top-right" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Platform Connections</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            {connectedCount === 0 ? 'Connect your first platform to start tracking earnings' : `Managing ${connectedCount} connected platform${connectedCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        {connectedCount > 0 && (
          <button
            onClick={handleSyncAll}
            disabled={syncingAll}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncingAll ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Syncing All...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync All Platforms
              </>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {(Object.keys(platformInfo) as Platform[]).map((platform) => {
          const connection = getConnection(platform);
          const isConnected = connection?.status === 'CONNECTED';
          const isSyncing = syncing[platform] || connection?.status === 'SYNCING';
          const isError = connection?.status === 'ERROR';

          return (
            <div
              key={platform}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg transition-shadow w-full overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${platformInfo[platform].color} rounded-lg flex items-center justify-center`}>
                    <Link2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{platformInfo[platform].name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {isConnected && !isSyncing && (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
                        </>
                      )}
                      {isSyncing && (
                        <>
                          <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Syncing...</span>
                        </>
                      )}
                      {isError && (
                        <>
                          <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span className="text-sm text-red-600 dark:text-red-400 font-medium">Error</span>
                        </>
                      )}
                      {!isConnected && !isSyncing && !isError && (
                        <>
                          <XCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Not Connected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isConnected && connection?.stats && (
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${connection.stats.revenue.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Sales</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {connection.stats.sales}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Last 7 Days</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${connection.stats.last7Days.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

              {isConnected && connection?.last_synced_at && (
                <div className="mb-4 space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last synced: {formatTimeAgo(connection.last_synced_at)}
                  </p>
                  {connection.connected_at && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Connected on {new Date(connection.connected_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                {isConnected || isError ? (
                  <>
                    <button
                      onClick={() => handleSync(platform)}
                      disabled={isSyncing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          {isError ? 'Retry Sync' : 'Sync Now'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlatform(platform);
                        setDisconnectModalOpen(true);
                      }}
                      className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPlatform(platform);
                      setConnectModalOpen(true);
                    }}
                    className="w-full px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Connect {platformInfo[platform].name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sync History Section */}
      {syncLogs.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center justify-between w-full text-left"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sync History</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {showHistory ? 'Hide' : 'Show'} ({syncLogs.length})
              </span>
            </button>
          </div>

          {showHistory && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Timestamp</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Platform</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Records</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Revenue</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {syncLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {new Date(log.synced_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${platformInfo[log.platform as Platform]?.color || 'bg-gray-100 text-gray-600'}`}>
                          {log.platform}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          log.status === 'SUCCESS' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                          log.status === 'FAILED' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                          'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{log.records_synced}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">${log.revenue_added.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{log.duration}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4 w-full overflow-hidden">
        <div className="flex gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
              How Platform Connections Work
            </h4>
            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-400">
              Connect your affiliate platforms to automatically sync your earnings data. We securely fetch your performance metrics and display them in one unified dashboard. Click "Sync Now" to manually refresh data anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {connectModalOpen && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 ${platformInfo[selectedPlatform].color} rounded-lg flex items-center justify-center`}>
                <Link2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Connect {platformInfo[selectedPlatform].name}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              To connect {platformInfo[selectedPlatform].name}, we'll sync your earnings data from their dashboard.
            </p>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Steps:</p>
              <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                <li>Click 'Start Connection' below</li>
                <li>We'll simulate accessing your {platformInfo[selectedPlatform].name} account</li>
                <li>Your earnings data will be imported automatically</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {connecting ? 'Connecting...' : 'Start Connection'}
              </button>
              <button
                onClick={() => {
                  setConnectModalOpen(false);
                  setSelectedPlatform(null);
                }}
                disabled={connecting}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disconnect Modal */}
      {disconnectModalOpen && selectedPlatform && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Disconnect {platformInfo[selectedPlatform].name}?
            </h3>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to disconnect {platformInfo[selectedPlatform].name}? Your historical data will be preserved, but we'll stop syncing new sales.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDisconnect}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Yes, Disconnect
              </button>
              <button
                onClick={() => {
                  setDisconnectModalOpen(false);
                  setSelectedPlatform(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
