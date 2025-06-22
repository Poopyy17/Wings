import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './Cart-Context.tsx';
import { SessionProvider } from './Session-Context.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SessionProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SessionProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
