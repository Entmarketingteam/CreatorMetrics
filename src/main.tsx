import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LTKAuthProvider } from './contexts/LTKAuthContext';
import App from './App.tsx';
import './index.css';

console.log('🚀 Starting app initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  throw new Error('Root element not found');
}

console.log('✅ Root element found, creating React root...');

try {
  createRoot(rootElement).render(
    <StrictMode>
      <ThemeProvider>
        <AuthProvider>
          <LTKAuthProvider>
            <App />
          </LTKAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </StrictMode>
  );
  console.log('✅ React app rendered successfully!');
} catch (error) {
  console.error('❌ Failed to render React app:', error);
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; background: #fee; border: 2px solid #f00; margin: 20px;">
      <h1 style="color: #c00;">Error Loading App</h1>
      <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
      <p>Check the browser console (F12) for more details.</p>
      <button onclick="localStorage.clear(); location.reload();" style="padding: 10px 20px; background: #c00; color: white; border: none; cursor: pointer; margin-top: 10px;">
        Clear Storage & Reload
      </button>
    </div>
  `;
  throw error;
}
