import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ltkAuthService } from '../lib/ltkAuth';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function LTKCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get authorization code and state from URL
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Check for OAuth errors
      if (error) {
        setStatus('error');
        setMessage(errorDescription || error || 'Authentication failed');
        setTimeout(() => navigate('/platforms'), 3000);
        return;
      }

      // Verify state (CSRF protection)
      const storedState = sessionStorage.getItem('ltk_oauth_state');
      if (!state || state !== storedState) {
        setStatus('error');
        setMessage('Invalid state parameter. Please try again.');
        sessionStorage.removeItem('ltk_oauth_state');
        setTimeout(() => navigate('/platforms'), 3000);
        return;
      }

      // Clear state from sessionStorage
      sessionStorage.removeItem('ltk_oauth_state');

      // Check if we have an authorization code
      if (!code) {
        setStatus('error');
        setMessage('No authorization code received. Please try again.');
        setTimeout(() => navigate('/platforms'), 3000);
        return;
      }

      // Exchange code for tokens via backend (more secure)
      setMessage('Exchanging authorization code for tokens...');
      
      const response = await fetch('/api/ltk/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, redirect_uri: `${window.location.origin}/auth/ltk/callback` }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Token exchange failed' }));
        throw new Error(errorData.error || `Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();

      // CRITICAL: Verify both tokens are present
      if (!tokenData.access_token || !tokenData.id_token) {
        throw new Error('Missing tokens in response. Expected both access_token and id_token.');
      }

      // Store tokens
      const tokens = {
        access_token: tokenData.access_token,
        id_token: tokenData.id_token,
        refresh_token: tokenData.refresh_token || '',
        expires_at: Math.floor(Date.now() / 1000) + (tokenData.expires_in || 3600),
        token_type: tokenData.token_type || 'Bearer',
      };

      ltkAuthService.storeTokens(tokens);

      setStatus('success');
      setMessage('Successfully connected to LTK! Redirecting...');

      // Redirect to platforms page after 2 seconds
      setTimeout(() => {
        navigate('/platforms?ltk_connected=true');
      }, 2000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
      
      setTimeout(() => {
        navigate('/platforms');
      }, 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connecting to LTK...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <button
              onClick={() => navigate('/platforms')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Go to Platforms
            </button>
          </>
        )}
      </div>
    </div>
  );
}
