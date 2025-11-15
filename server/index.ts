import express from 'express';
import cors from 'cors';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ltkProxyRoutes from './routes/ltkProxy.js';
import instagramPostsRoutes from './routes/instagramPosts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    environment: isProd ? 'production' : 'development',
    timestamp: new Date().toISOString() 
  });
});

// LTK Proxy routes
app.use('/api/ltk', ltkProxyRoutes);

// Instagram Posts routes
app.use('/api/instagram-posts', instagramPostsRoutes);

// Production: Serve static files from dist folder
if (isProd) {
  const distPath = join(__dirname, '..', 'dist');
  const indexPath = join(distPath, 'index.html');
  
  // Serve static assets FIRST (before fallback)
  app.use(express.static(distPath));
  
  // SPA fallback - serve index.html for all non-API GET routes
  app.get('*', (req, res) => {
    // Check if build exists before attempting to serve
    if (!existsSync(indexPath)) {
      console.error('Build not found:', indexPath);
      return res.status(503).send('Application build not available. Please run: npm run build');
    }
    
    // Serve with error callback for async sendFile
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Failed to serve index.html:', err);
        res.status(500).send('Failed to serve application');
      }
    });
  });
  
  console.log(`📦 Serving static files from: ${distPath}`);
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📡 LTK proxy available at http://localhost:${PORT}/api/ltk`);
  if (isProd) {
    console.log(`🌐 Frontend served from /dist on port ${PORT}`);
  }
});
