/**
 * Vercel Serverless Function Entry Point
 * 
 * This file is used by Vercel to handle API routes
 * In production, Vercel will use this for /api/* routes
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Re-export the Express app setup
// Note: For Vercel, we may need to adapt this to serverless functions
// For now, this serves as a placeholder

export default function handler(req: VercelRequest, res: VercelResponse) {
  // This will be handled by the Express server in server/index.ts
  // Vercel may need separate serverless functions for each route
  res.status(200).json({ message: 'API endpoint - use Railway for full backend' });
}
