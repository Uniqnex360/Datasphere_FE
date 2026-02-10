import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Enrichment } from './pages/Enrichment';
import { Categories } from './pages/Categories';
import { Attributes } from './pages/Attributes';
// import { ImportExport } from './pages/ImportExport';
import { Channels } from './pages/Channels';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { VendorMaster } from './pages/VendorMaster';
import { BrandMaster } from './pages/BrandMaster';
import { Login } from './pages/Login';
import DigitalAssets from './pages/DigitalAssets';
import Price from './pages/PriceManagement';
import Inventory from './pages/Inventory';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(auth === 'true');
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={setCurrentPage} />;
      case 'products':
        return <Products />;
      case 'price':
        return <Price />;
      case 'inventory':
        return <Inventory />;
      case 'enrichment':
        return <Enrichment />;
      case 'categories':
        return <Categories />;
      case 'attributes':
        return <Attributes />;
      case 'vendors':
        return <VendorMaster />;
      case 'brands':
        return <BrandMaster />;
      case 'assets':
        return <DigitalAssets />;
      case 'import-export':
        return <ImportExport />;
      case 'channels':
        return <Channels />;
      case 'users':
        return <Users />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}

export default App;
