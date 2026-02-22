import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);
const API = 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banInfo, setBanInfo] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      setLoading(false);
      return;
    }
    const parsed = JSON.parse(savedUser);
    setUser(parsed);
    fetch(`${API}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parsed.id })
    })
      .then(res => res.json())
      .then(data => {
        if (data.banned && data.banInfo) {
          setUser(null);
          localStorage.removeItem('user');
          setBanInfo(data.banInfo);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password, captcha = {}) => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, ...captcha })
      });
      const data = await res.json();
      if (data.banned && data.banInfo) {
        setUser(null);
        setBanInfo(data.banInfo);
        return { success: false, error: data.error || 'Аккаунт заблокирован', banned: true };
      }
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setBanInfo(null);
        return { success: true };
      }
      return { success: false, error: data.error || 'Ошибка входа' };
    } catch (error) {
      return { success: false, error: 'Ошибка подключения' };
    }
  };

  const register = async (username, email, password, captcha = {}) => {
    try {
      const res = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, ...captcha })
      });
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setBanInfo(null);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (error) {
      return { success: false, error: 'Ошибка подключения' };
    }
  };

  const logout = () => {
    setUser(null);
    setBanInfo(null);
    localStorage.removeItem('user');
  };

  const clearBanInfo = () => {
    setBanInfo(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, banInfo, clearBanInfo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
