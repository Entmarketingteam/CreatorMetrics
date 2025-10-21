import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { DateRangeProvider } from './contexts/DateRangeContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <DateRangeProvider>
          <App />
        </DateRangeProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
