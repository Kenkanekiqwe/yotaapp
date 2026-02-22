import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import ThemeSwitcher from './ThemeSwitcher'
import Avatar from './Avatar'
import DisplayName from './DisplayName'
import './Header.css'

function Header() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <span className="logo-icon">🔌</span>
          <span>Yota Plugins</span>
        </Link>
        
        <nav className={`header-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={`nav-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
            Главная
          </Link>
          <Link to="/plugins" className={`nav-link ${isActive('/plugins') || isActive('/plugin') ? 'active' : ''}`}>
            Плагины
          </Link>
          <Link to="/forum" className={`nav-link ${isActive('/forum') || isActive('/thread') ? 'active' : ''}`}>
            Форум
          </Link>
          <Link to="/members" className={`nav-link ${isActive('/members') || isActive('/profile') ? 'active' : ''}`}>
            Участники
          </Link>
        </nav>

        <div className="header-user">
          <ThemeSwitcher />
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn-secondary btn-admin">
                  Админка
                </Link>
              )}
              <Link to={`/profile/${user.username}`} className="user-info">
                <Avatar src={user.avatar} fallback={user.username} size="sm" className="user-avatar" />
                <span className="user-name">
                  <DisplayName
                    name={user.username}
                    shimmer={user.username_shimmer}
                    shimmerColor1={user.username_shimmer_color1}
                    shimmerColor2={user.username_shimmer_color2}
                    verified={user.username_verified}
                  />
                </span>
              </Link>
              <button onClick={logout} className="logout-btn">Выйти</button>
            </>
          ) : (
            <Link to="/login" className="login-btn">Войти</Link>
          )}
        </div>

        <button 
          className="mobile-menu-btn" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
      </div>
    </header>
  )
}

export default Header
