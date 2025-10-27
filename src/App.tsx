import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthProvider';
import MainLayout from './components/layout/MainLayout';
import PendingVerificationPage from './pages/auth/PendingVerificationPage';
import OnboardingPage from './pages/onboarding/OnboardingPage';
import LandingPage from './pages/landing/LandingPage';
import BillingSuccessPage from './pages/billing/SuccessPage';
import BillingCancelPage from './pages/billing/CancelPage';
import RevoSendPage from './pages/landing/RevoSendPage';
import RevoFluxoPage from './pages/landing/RevoFluxoPage';
import Dashboard from './pages/Dashboard';
import SalesDashboard from './pages/SalesDashboard';
import ProductsPage from './pages/products/ProductsPage';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { session, loading, empresas } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  
  if (empresas.length === 0) {
    if (location.pathname !== '/onboarding/create-company') {
      return <Navigate to="/onboarding/create-company" replace />;
    }
  }
  
  return children;
};

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/revo-send" element={<RevoSendPage />} />
      <Route path="/revo-fluxo" element={<RevoFluxoPage />} />
      
      <Route path="/auth/pending-verification" element={<PendingVerificationPage />} />
      
      <Route 
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sales-dashboard" element={<SalesDashboard />} />
        <Route path="products" element={<ProductsPage />} />
        
        <Route path="billing/success" element={<BillingSuccessPage />} />
        <Route path="billing/cancel" element={<BillingCancelPage />} />
      </Route>
      
      <Route 
        path="/onboarding/create-company" 
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
