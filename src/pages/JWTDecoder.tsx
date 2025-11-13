import { useState } from 'react';
import { AlertCircle, CheckCircle, Copy, Key } from 'lucide-react';
import { decodeJWT, formatTokenDate, getTimeRemaining, isTokenExpired, DecodedToken } from '../utils/jwtDecoder';

export default function JWTDecoder() {
  const [tokenInput, setTokenInput] = useState('');
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<string>('');

  const handleDecode = () => {
    setError('');
    setDecodedToken(null);

    if (!tokenInput.trim()) {
      setError('Please enter a JWT token');
      return;
    }

    try {
      const decoded = decodeJWT(tokenInput);
      setDecodedToken(decoded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decode token');
    }
  };

  const handleCopy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleClear = () => {
    setTokenInput('');
    setDecodedToken(null);
    setError('');
  };

  const expired = decodedToken ? isTokenExpired(decodedToken.payload) : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">JWT Token Decoder</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Decode and inspect JWT tokens securely in your browser
          </p>
        </div>
        <Key className="h-12 w-12 text-blue-500" />
      </div>

      {/* Input Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          JWT Token
        </label>
        <textarea
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Paste your JWT token here (with or without 'Bearer ' prefix)..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
          rows={6}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleDecode}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Decode Token
          </button>
          <button
            onClick={handleClear}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        )}
      </div>

      {/* Decoded Token Display */}
      {decodedToken && (
        <div className="space-y-6">
          {/* Token Status */}
          <div className={`p-4 rounded-lg border ${
            expired
              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          }`}>
            <div className="flex items-center gap-2">
              {expired ? (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <span className="font-medium text-red-700 dark:text-red-400">Token Expired</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-700 dark:text-green-400">Token Valid</span>
                </>
              )}
            </div>
            {decodedToken.payload.exp && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {expired ? 'Expired' : getTimeRemaining(decodedToken.payload.exp)}
                {' '}
                ({formatTokenDate(decodedToken.payload.exp)})
              </p>
            )}
          </div>

          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Header</h2>
              <button
                onClick={() => handleCopy(JSON.stringify(decodedToken.header, null, 2), 'header')}
                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <Copy className="h-4 w-4" />
                {copied === 'header' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-gray-800 dark:text-gray-200">
                {JSON.stringify(decodedToken.header, null, 2)}
              </code>
            </pre>
          </div>

          {/* Payload */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payload</h2>
              <button
                onClick={() => handleCopy(JSON.stringify(decodedToken.payload, null, 2), 'payload')}
                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <Copy className="h-4 w-4" />
                {copied === 'payload' ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Standard Claims */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {decodedToken.payload.iss && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Issuer (iss)</span>
                  <p className="text-gray-900 dark:text-white break-all">{decodedToken.payload.iss}</p>
                </div>
              )}
              {decodedToken.payload.sub && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Subject (sub)</span>
                  <p className="text-gray-900 dark:text-white break-all">{decodedToken.payload.sub}</p>
                </div>
              )}
              {decodedToken.payload.aud && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Audience (aud)</span>
                  <p className="text-gray-900 dark:text-white break-all">
                    {Array.isArray(decodedToken.payload.aud)
                      ? decodedToken.payload.aud.join(', ')
                      : decodedToken.payload.aud}
                  </p>
                </div>
              )}
              {decodedToken.payload.iat && (
                <div>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Issued At (iat)</span>
                  <p className="text-gray-900 dark:text-white">{formatTokenDate(decodedToken.payload.iat)}</p>
                </div>
              )}
            </div>

            {/* Full Payload JSON */}
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-gray-800 dark:text-gray-200">
                {JSON.stringify(decodedToken.payload, null, 2)}
              </code>
            </pre>
          </div>

          {/* Signature */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Signature</h2>
              <button
                onClick={() => handleCopy(decodedToken.signature, 'signature')}
                className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                <Copy className="h-4 w-4" />
                {copied === 'signature' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              <code className="text-gray-800 dark:text-gray-200 break-all">
                {decodedToken.signature}
              </code>
            </pre>
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              Note: This signature is base64url encoded. Token verification requires the issuer's public key.
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 dark:text-blue-300 mb-2">About JWT Decoding</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• All decoding happens locally in your browser - tokens are never sent to a server</li>
          <li>• This tool only decodes the token - it does not verify the signature</li>
          <li>• JWT tokens contain three parts: Header, Payload, and Signature</li>
          <li>• The payload contains claims about the user and token metadata</li>
        </ul>
      </div>
    </div>
  );
}
