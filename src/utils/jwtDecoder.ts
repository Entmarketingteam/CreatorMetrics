import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  header: {
    alg?: string;
    typ?: string;
    kid?: string;
    [key: string]: any;
  };
  payload: {
    iss?: string;
    sub?: string;
    aud?: string | string[];
    exp?: number;
    iat?: number;
    nbf?: number;
    scope?: string;
    azp?: string;
    [key: string]: any;
  };
  signature: string;
}

/**
 * Decodes a JWT token into its header, payload, and signature components
 * @param token - The JWT token string (with or without 'Bearer ' prefix)
 * @returns DecodedToken object containing header, payload, and signature
 * @throws Error if the token is invalid
 */
export function decodeJWT(token: string): DecodedToken {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.trim().replace(/^Bearer\s+/i, '');

    // Split the token into parts
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format. Token must have 3 parts separated by dots.');
    }

    // Decode header
    const header = JSON.parse(atob(parts[0]));

    // Decode payload using jwt-decode library
    const payload = jwtDecode(cleanToken);

    // Signature (kept as base64url encoded string)
    const signature = parts[2];

    return {
      header,
      payload: payload as any,
      signature
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode JWT: ${error.message}`);
    }
    throw new Error('Failed to decode JWT: Unknown error');
  }
}

/**
 * Checks if a JWT token is expired
 * @param token - The decoded payload or full token string
 * @returns true if expired, false if still valid
 */
export function isTokenExpired(token: string | { exp?: number }): boolean {
  try {
    const payload = typeof token === 'string' ? jwtDecode(token.replace(/^Bearer\s+/i, '')) : token;

    if (!payload.exp) {
      return false; // No expiration claim
    }

    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    return true; // If we can't decode it, treat as expired
  }
}

/**
 * Formats a Unix timestamp to a readable date string
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date string
 */
export function formatTokenDate(timestamp?: number): string {
  if (!timestamp) return 'N/A';
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Gets the time remaining until token expiration
 * @param exp - Expiration timestamp in seconds
 * @returns Human-readable time remaining string
 */
export function getTimeRemaining(exp?: number): string {
  if (!exp) return 'No expiration';

  const now = Date.now();
  const expirationMs = exp * 1000;
  const remainingMs = expirationMs - now;

  if (remainingMs <= 0) {
    return 'Expired';
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''} remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  }

  return `${seconds}s remaining`;
}
