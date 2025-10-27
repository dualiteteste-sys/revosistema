import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthProvider.tsx';
import { ToastProvider } from './contexts/ToastProvider.tsx';
import './index.css';
import AuthConfirmed from './pages/auth/Confirmed.tsx';

const rootElement = document.getElementById('root')!;
const root = createRoot(rootElement);

/**
 * Bootstrap condicional:
 * - Se a URL for /auth/confirmed, renderiza a página de confirmação "sozinha"
 *   para processar o hash do Supabase sem depender do router.
 * - Caso contrário, renderiza o App normalmente com todos os providers.
 */
if (window.location.pathname.startsWith('/auth/confirmed')) {
  root.render(
    <StrictMode>
      <AuthConfirmed />
    </StrictMode>
  );
} else {
  root.render(
    <StrictMode>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

(window as any).__billingDiagnostics__ = {
  VITE_FUNCTIONS_BASE_URL: import.meta.env.VITE_FUNCTIONS_BASE_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
};
