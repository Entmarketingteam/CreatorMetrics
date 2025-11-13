import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { LTKAuthProvider } from './contexts/LTKAuthContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
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
