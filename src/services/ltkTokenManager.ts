/**
 * LTK Token Manager
 * Securely stores and manages LTK authentication credentials
 */

import { LTKCredentials } from './ltkApi';

const STORAGE_KEY = 'ltk_credentials';
const ENCRYPTION_KEY = 'ltk_enc_key'; // In production, use proper encryption

export interface StoredLTKCredentials extends LTKCredentials {
  createdAt: string;
  lastValidated?: string;
  userId?: string;
}

/**
 * Token Manager for LTK credentials
 */
export class LTKTokenManager {
  /**
   * Store credentials securely
   */
  async storeCredentials(credentials: LTKCredentials, userId?: string): Promise<void> {
    const stored: StoredLTKCredentials = {
      ...credentials,
      createdAt: new Date().toISOString(),
      lastValidated: new Date().toISOString(),
      userId,
    };

    // In production, encrypt before storing
    // For now, we'll store in localStorage (not ideal for production)
    try {
      const encrypted = this.encrypt(JSON.stringify(stored));
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Error storing credentials:', error);
      throw new Error('Failed to store credentials');
    }
  }

  /**
   * Retrieve stored credentials
   */
  async getCredentials(): Promise<StoredLTKCredentials | null> {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) {
        return null;
      }

      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted) as StoredLTKCredentials;
    } catch (error) {
      console.error('Error retrieving credentials:', error);
      return null;
    }
  }

  /**
   * Update last validated timestamp
   */
  async updateLastValidated(): Promise<void> {
    const credentials = await this.getCredentials();
    if (credentials) {
      credentials.lastValidated = new Date().toISOString();
      await this.storeCredentials(credentials, credentials.userId);
    }
  }

  /**
   * Check if credentials exist
   */
  async hasCredentials(): Promise<boolean> {
    return (await this.getCredentials()) !== null;
  }

  /**
   * Check if credentials are expired
   */
  async isExpired(): Promise<boolean> {
    const credentials = await this.getCredentials();
    if (!credentials || !credentials.expiresAt) {
      return false;
    }

    return new Date(credentials.expiresAt) < new Date();
  }

  /**
   * Clear stored credentials
   */
  async clearCredentials(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Simple encryption (Base64 + XOR)
   * NOTE: This is NOT secure for production! Use proper encryption library
   */
  private encrypt(text: string): string {
    // In production, use a proper encryption library like crypto-js
    // This is just a basic obfuscation
    const key = this.getEncryptionKey();
    let encrypted = '';

    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }

    return btoa(encrypted); // Base64 encode
  }

  /**
   * Simple decryption
   */
  private decrypt(encrypted: string): string {
    try {
      const decoded = atob(encrypted); // Base64 decode
      const key = this.getEncryptionKey();
      let decrypted = '';

      for (let i = 0; i < decoded.length; i++) {
        decrypted += String.fromCharCode(
          decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }

      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt credentials');
    }
  }

  /**
   * Get or generate encryption key
   */
  private getEncryptionKey(): string {
    let key = localStorage.getItem(ENCRYPTION_KEY);
    if (!key) {
      // Generate a random key
      key = Array.from({ length: 32 }, () =>
        String.fromCharCode(Math.floor(Math.random() * 94) + 33)
      ).join('');
      localStorage.setItem(ENCRYPTION_KEY, key);
    }
    return key;
  }

  /**
   * Validate credentials format
   */
  validateCredentialsFormat(credentials: Partial<LTKCredentials>): { valid: boolean; error?: string } {
    if (!credentials.type) {
      return { valid: false, error: 'Credential type is required' };
    }

    if (!['bearer', 'cookie', 'api_key'].includes(credentials.type)) {
      return { valid: false, error: 'Invalid credential type' };
    }

    if (!credentials.value || credentials.value.trim().length === 0) {
      return { valid: false, error: 'Credential value is required' };
    }

    // Validate format based on type
    if (credentials.type === 'bearer') {
      // JWT tokens typically start with 'eyJ'
      if (!credentials.value.startsWith('eyJ')) {
        return {
          valid: false,
          error: 'Bearer token should be a JWT (starting with "eyJ")'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get credential metadata (without sensitive data)
   */
  async getMetadata(): Promise<{
    hasCredentials: boolean;
    type?: string;
    createdAt?: string;
    lastValidated?: string;
    isExpired?: boolean;
  }> {
    const credentials = await this.getCredentials();

    if (!credentials) {
      return { hasCredentials: false };
    }

    return {
      hasCredentials: true,
      type: credentials.type,
      createdAt: credentials.createdAt,
      lastValidated: credentials.lastValidated,
      isExpired: await this.isExpired(),
    };
  }
}

// Export singleton instance
export const ltkTokenManager = new LTKTokenManager();
