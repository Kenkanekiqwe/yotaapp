import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useEffect, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import NoticeBanner from './components/NoticeBanner'
import BanScreen from './components/BanScreen'
import Home from './pages/Home'
import PluginList from './pages/PluginList'
import PluginDetail from './pages/PluginDetail'
import Forum from './pages/Forum'
import Thread from './pages/Thread'
import Profile from './pages/Profile'
import Members from './pages/Members'
import Categories from './pages/Categories'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminPanel from './pages/AdminPanel'
import './App.css'
import './components/Toast.css'
import './components/ThemeSwitcher.css'
import './components/Avatar.css'
import './components/DisplayName.css'

function MaintenancePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      textAlign: 'center',
      padding: '2rem'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</h1>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Технические работы</h2>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
        Сайт временно недоступен в связи с проведением технических работ. 
        Приносим извинения за неудобства. Пожалуйста, зайдите позже.
      </p>
    </div>
  );
}

function AppContent() {
  const { user, banInfo, clearBanInfo } = useAuth();
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  useEffect(() => {
    const isMaintenanceMode = localStorage.getItem('maintenanceMode') === 'true';
    setMaintenanceMode(isMaintenanceMode);
  }, []);

  if (banInfo) {
    return <BanScreen banInfo={banInfo} onClose={clearBanInfo} />;
  }

  if (maintenanceMode && (!user || user.role !== 'admin')) {
    return <MaintenancePage />;
  }

  return (
    <div className="app">
      <Header />
      <NoticeBanner />
      <main className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plugins" element={<PluginList />} />
          <Route path="/plugin/:slug" element={<PluginDetail />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:category" element={<Forum />} />
          <Route path="/thread/:id" element={<Thread />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/members" element={<Members />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  // Применяем сохраненную тему при загрузке приложения
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme !== 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
