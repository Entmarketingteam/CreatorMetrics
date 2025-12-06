import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Earnings from './pages/Earnings';
import Products from './pages/Products';
import Content from './pages/Content';
import ContentAnalytics from './pages/ContentAnalytics';
import Insights from './pages/Insights';
import Platforms from './pages/Platforms';
import Import from './pages/Import';
import InstagramImport from './pages/InstagramImport';
import JWTDecoder from './pages/JWTDecoder';
import LTKTest from './pages/LTKTest';
import InstagramPosts from './pages/InstagramPosts';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
// Foretrust Pages
import ForetrustDashboard from './foretrust/pages/ForetrustDashboard';
import ForetrustNewDeal from './foretrust/pages/ForetrustNewDeal';
import ForetrustDealDetail from './foretrust/pages/ForetrustDealDetail';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/earnings"
          element={
            <ProtectedRoute>
              <Layout><Earnings /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Layout><Products /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content"
          element={
            <ProtectedRoute>
              <Layout><Content /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/content-analytics"
          element={
            <ProtectedRoute>
              <Layout><ContentAnalytics /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <Layout><Insights /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/platforms"
          element={
            <ProtectedRoute>
              <Layout><Platforms /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import"
          element={
            <ProtectedRoute>
              <Layout><Import /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instagram-import"
          element={
            <ProtectedRoute>
              <Layout><InstagramImport /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jwt-decoder"
          element={
            <ProtectedRoute>
              <Layout><JWTDecoder /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ltk-test"
          element={<LTKTest />}
        />
        <Route
          path="/instagram-posts"
          element={
            <ProtectedRoute>
              <Layout><InstagramPosts /></Layout>
            </ProtectedRoute>
          }
        />
        {/* Foretrust Routes */}
        <Route
          path="/foretrust"
          element={
            <ProtectedRoute>
              <Layout><ForetrustDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/foretrust/new"
          element={
            <ProtectedRoute>
              <Layout><ForetrustNewDeal /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/foretrust/deal/:dealId"
          element={
            <ProtectedRoute>
              <Layout><ForetrustDealDetail /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
