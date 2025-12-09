import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Link2, CheckCircle2, XCircle, Key, Loader2, X, AlertCircle } from 'lucide-react';
import { useLTKAuth } from '../contexts/LTKAuthContext';
import { useAuth } from '../contexts/AuthContext';

const LTK_MIDDLEWARE_URL = 'https://ltk-auth-middleware-production.up.railway.app';

interface LTKConnectionStatus {
  connected: boolean;
  platform?: string;
  lastRefresh?: string;
  tokenExpiry?: string;
  error?: string;
}

export default function Platforms() {
  const { isAuthenticated, clearAuth, setTokensManually } = useLTKAuth();
  const { user } = useAuth();

  // Modal state
  const [showLTKModal, setShowLTKModal] = useState(false);
  const [ltkEmail, setLtkEmail] = useState('');
  const [ltkPassword, setLtkPassword] = useState('');

  // Connection state
  const [connecting, setConnecting] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<LTKConnectionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check LTK connection status on mount
  useEffect(() => {
    if (user?.id) {
      checkLTKStatus();
    } else {
      setCheckingStatus(false);
    }
  }, [user?.id]);

  const checkLTKStatus = async () => {
    if (!user?.id) return;

    setCheckingStatus(true);
    setError(null);

    try {
      const response = await fetch(`${LTK_MIDDLEWARE_URL}/api/ltk/status/${user.id}`);
      const data = await response.json();

      if (response.ok) {
        setConnectionStatus(data);
      } else {
        setConnectionStatus({ connected: false });
      }
    } catch (err) {
      console.error('Failed to check LTK status:', err);
      setConnectionStatus({ connected: false });
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleLTKConnect = () => {
    setError(null);
    setSuccessMessage(null);
    setShowLTKModal(true);
  };

  const handleLTKSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('You must be logged in to connect LTK');
      return;
    }

    if (!ltkEmail || !ltkPassword) {
      setError('Please enter both email and password');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const response = await fetch(`${LTK_MIDDLEWARE_URL}/api/ltk/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: ltkEmail,
          password: ltkPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // If the middleware returns tokens, store them locally too
        if (data.tokens) {
          setTokensManually(data.tokens);
        }

        setSuccessMessage('LTK connected successfully!');
        setShowLTKModal(false);
        setLtkEmail('');
        setLtkPassword('');

        // Refresh connection status
        await checkLTKStatus();
      } else {
        setError(data.error || data.message || 'Failed to connect LTK. Please check your credentials.');
      }
    } catch (err) {
      console.error('LTK connect error:', err);
      setError('Network error. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleLTKDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your LTK account? This will remove all stored tokens.')) {
      return;
    }

    // Clear local auth
    clearAuth();

    // Optionally call middleware to clear server-side tokens
    if (user?.id) {
      try {
        await fetch(`${LTK_MIDDLEWARE_URL}/api/ltk/disconnect/${user.id}`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to disconnect on server:', err);
      }
    }

    setConnectionStatus({ connected: false });
    setSuccessMessage('LTK disconnected successfully');
  };

  const isLTKConnected = connectionStatus?.connected || isAuthenticated;

  const platforms = [
    {
      id: 1,
      name: 'LTK',
      connected: isLTKConnected,
      revenue: 5420,
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      hasJWTDecoder: true,
      onConnect: handleLTKConnect,
      onDisconnect: handleLTKDisconnect,
      isLTK: true,
    },
    {
      id: 2,
      name: 'Amazon',
      connected: true,
      revenue: 3280,
      color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
    },
    {
      id: 3,
      name: 'Walmart',
      connected: false,
      revenue: 0,
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
    {
      id: 4,
      name: 'ShopStyle',
      connected: false,
      revenue: 0,
      color: 'bg-pink-100 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 w-full overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Platform Connections</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your affiliate platform connections</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <p className="text-green-700 dark:text-green-300">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && !showLTKModal && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-lg transition-shadow w-full overflow-hidden"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${platform.color} rounded-lg flex items-center justify-center`}>
                  <Link2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{platform.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {platform.isLTK && checkingStatus ? (
                      <>
                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Checking...</span>
                      </>
                    ) : platform.connected ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">Connected</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">Not Connected</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {platform.connected && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${platform.revenue.toFixed(2)}
                </p>
                {platform.isLTK && connectionStatus?.lastRefresh && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Last synced: {new Date(connectionStatus.lastRefresh).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              {platform.hasJWTDecoder && platform.connected && (
                <Link
                  to="/jwt-decoder"
                  className="w-full px-4 py-2 rounded-lg font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                >
                  <Key className="w-4 h-4" />
                  View JWT Tokens
                </Link>
              )}
              <button
                onClick={platform.connected ? platform.onDisconnect : platform.onConnect}
                disabled={platform.isLTK && checkingStatus}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  platform.connected
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                data-testid={`button-${platform.name.toLowerCase()}-${platform.connected ? 'disconnect' : 'connect'}`}
              >
                {platform.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* LTK Connect Modal */}
      {showLTKModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect LTK Account</h2>
              <button
                onClick={() => {
                  setShowLTKModal(false);
                  setError(null);
                }}
                disabled={connecting}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLTKSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div>
                <label htmlFor="ltk-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LTK Email
                </label>
                <input
                  type="email"
                  id="ltk-email"
                  value={ltkEmail}
                  onChange={(e) => setLtkEmail(e.target.value)}
                  disabled={connecting}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              <div>
                <label htmlFor="ltk-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  LTK Password
                </label>
                <input
                  type="password"
                  id="ltk-password"
                  value={ltkPassword}
                  onChange={(e) => setLtkPassword(e.target.value)}
                  disabled={connecting}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
              </div>

              {connecting && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                    <div>
                      <p className="font-medium text-indigo-700 dark:text-indigo-300">Connecting to LTK...</p>
                      <p className="text-sm text-indigo-600 dark:text-indigo-400">This may take up to 30 seconds</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLTKModal(false);
                    setError(null);
                  }}
                  disabled={connecting}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connecting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Connect LTK'
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Your credentials are securely transmitted and encrypted. We never store your plain-text password.
              </p>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
