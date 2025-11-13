import { useState } from 'react';
import { useLTKAuth } from '../contexts/LTKAuthContext';
import { LTKTokens } from '../lib/ltkAuth';
import { RefreshCw, Trash2, Key, Clock, CheckCircle, XCircle, Copy, Check } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function JWTDecoder() {
  const { tokens, decodedToken, isAuthenticated, isExpired, expiresIn, refreshToken, clearAuth, setTokensManually } = useLTKAuth();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);
  const [manualTokenInput, setManualTokenInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshToken();
      toast({
        title: 'Token Refreshed',
        description: 'Your access token has been successfully refreshed.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: error instanceof Error ? error.message : 'Failed to refresh token',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearTokens = () => {
    clearAuth();
    toast({
      title: 'Tokens Cleared',
      description: 'All LTK authentication tokens have been removed.',
    });
  };

  const handleManualTokenSubmit = () => {
    try {
      const parsed = JSON.parse(manualTokenInput);
      const tokens: LTKTokens = {
        access_token: parsed.access_token,
        refresh_token: parsed.refresh_token,
        expires_at: parsed.expires_at || Math.floor(Date.now() / 1000) + 3600,
        token_type: parsed.token_type || 'Bearer',
      };
      setTokensManually(tokens);
      setShowManualInput(false);
      setManualTokenInput('');
      toast({
        title: 'Tokens Added',
        description: 'LTK tokens have been manually added and decoded.',
      });
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Please enter valid JSON with access_token and refresh_token fields.',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h1 font-bold text-foreground">JWT Token Decoder</h1>
        <p className="text-body text-muted-foreground mt-1">
          View and manage your LTK authentication tokens
        </p>
      </div>

      {/* Status Card */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h3 font-semibold text-foreground">Authentication Status</h2>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2 text-green-500">
                <CheckCircle className="w-5 h-5" />
                <span className="text-body font-medium">Authenticated</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle className="w-5 h-5" />
                <span className="text-body font-medium">Not Authenticated</span>
              </div>
            )}
          </div>
        </div>

        {expiresIn !== null && (
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Clock className="w-5 h-5" />
            <span className="text-body">
              {isExpired ? 'Expired' : `Expires in: ${formatTime(expiresIn)}`}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={!tokens || refreshing}
            className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-refresh-token"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Token'}
          </button>

          <button
            onClick={handleClearTokens}
            disabled={!tokens}
            className="flex items-center gap-2 bg-red-500 text-white rounded-lg px-4 py-2 font-medium hover-elevate active-elevate-2 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-clear-tokens"
          >
            <Trash2 className="w-4 h-4" />
            Clear Tokens
          </button>

          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="flex items-center gap-2 bg-accent text-accent-foreground rounded-lg px-4 py-2 font-medium hover-elevate active-elevate-2"
            data-testid="button-manual-input"
          >
            <Key className="w-4 h-4" />
            Manual Input
          </button>
        </div>
      </div>

      {/* Manual Token Input */}
      {showManualInput && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h3 className="text-h3 font-semibold text-foreground mb-4">Add Tokens Manually</h3>
          <p className="text-body text-muted-foreground mb-4">
            Paste your LTK tokens JSON below (should include access_token, refresh_token, and optionally expires_at):
          </p>
          <textarea
            value={manualTokenInput}
            onChange={(e) => setManualTokenInput(e.target.value)}
            placeholder='{"access_token": "...", "refresh_token": "...", "expires_at": 1234567890}'
            className="w-full min-h-32 bg-background border border-border rounded-lg p-3 text-body text-foreground font-mono text-sm"
            data-testid="textarea-manual-tokens"
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleManualTokenSubmit}
              className="bg-primary text-primary-foreground rounded-lg px-4 py-2 font-medium hover-elevate active-elevate-2"
              data-testid="button-submit-manual-tokens"
            >
              Add Tokens
            </button>
            <button
              onClick={() => {
                setShowManualInput(false);
                setManualTokenInput('');
              }}
              className="bg-accent text-accent-foreground rounded-lg px-4 py-2 font-medium hover-elevate active-elevate-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Token Details */}
      {tokens && decodedToken && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decoded Payload */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-h3 font-semibold text-foreground mb-4">Decoded Token Payload</h3>
            <div className="space-y-3">
              {Object.entries(decodedToken).map(([key, value]) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-small text-muted-foreground font-medium">{key}</span>
                  <div className="flex items-center justify-between gap-2 bg-background rounded-md p-2 border border-border">
                    <span className="text-body text-foreground font-mono text-sm truncate">
                      {key === 'exp' || key === 'iat' ? formatDate(value as number) : String(value)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(String(value), key)}
                      className="flex-shrink-0 p-1 hover-elevate active-elevate-2 rounded"
                      data-testid={`button-copy-${key}`}
                    >
                      {copiedField === key ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Tokens */}
          <div className="bg-card rounded-lg p-6 border border-border">
            <h3 className="text-h3 font-semibold text-foreground mb-4">Raw Tokens</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <span className="text-small text-muted-foreground font-medium">Access Token</span>
                <div className="flex items-start justify-between gap-2 bg-background rounded-md p-2 border border-border">
                  <span className="text-body text-foreground font-mono text-xs break-all">
                    {tokens.access_token}
                  </span>
                  <button
                    onClick={() => copyToClipboard(tokens.access_token, 'access_token')}
                    className="flex-shrink-0 p-1 hover-elevate active-elevate-2 rounded"
                    data-testid="button-copy-access-token"
                  >
                    {copiedField === 'access_token' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-small text-muted-foreground font-medium">Refresh Token</span>
                <div className="flex items-start justify-between gap-2 bg-background rounded-md p-2 border border-border">
                  <span className="text-body text-foreground font-mono text-xs break-all">
                    {tokens.refresh_token}
                  </span>
                  <button
                    onClick={() => copyToClipboard(tokens.refresh_token, 'refresh_token')}
                    className="flex-shrink-0 p-1 hover-elevate active-elevate-2 rounded"
                    data-testid="button-copy-refresh-token"
                  >
                    {copiedField === 'refresh_token' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-small text-muted-foreground font-medium">Expires At</span>
                <div className="bg-background rounded-md p-2 border border-border">
                  <span className="text-body text-foreground font-mono text-sm">
                    {formatDate(tokens.expires_at)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-small text-muted-foreground font-medium">Token Type</span>
                <div className="bg-background rounded-md p-2 border border-border">
                  <span className="text-body text-foreground font-mono text-sm">
                    {tokens.token_type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Tokens Message */}
      {!tokens && (
        <div className="bg-card rounded-lg p-12 border border-border text-center">
          <Key className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-h3 font-semibold text-foreground mb-2">No Tokens Found</h3>
          <p className="text-body text-muted-foreground mb-6">
            You haven't connected your LTK account yet. Add tokens manually to get started, or connect through the Platforms page.
          </p>
          <button
            onClick={() => setShowManualInput(true)}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-3 font-medium hover-elevate active-elevate-2"
          >
            Add Tokens Manually
          </button>
        </div>
      )}
    </div>
  );
}
