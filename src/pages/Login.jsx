import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import './Login.css';

const API = API_URL;

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableCaptcha, setEnableCaptcha] = useState(true);
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const loadPublicSettings = async () => {
    try {
      const res = await fetch(`${API}/settings/public`);
      const data = await res.json();
      setEnableCaptcha(!!data.enableCaptcha);
    } catch {
      setEnableCaptcha(true);
    }
  };

  const loadCaptcha = async () => {
    if (!enableCaptcha) return;
    try {
      const res = await fetch(`${API}/captcha`);
      const data = await res.json();
      setCaptcha({ id: data.id, a: data.a, b: data.b });
      setCaptchaAnswer('');
    } catch {
      setCaptcha(null);
    }
  };

  useEffect(() => {
    loadPublicSettings();
  }, []);

  useEffect(() => {
    if (enableCaptcha) loadCaptcha();
    else setCaptcha(null);
  }, [enableCaptcha]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const captchaPayload = enableCaptcha && captcha
      ? { captchaId: captcha.id, captchaAnswer: captchaAnswer.trim() }
      : {};
    const result = await login(username, password, captchaPayload);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Ошибка входа');
      if (enableCaptcha) loadCaptcha();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Вход</h1>
        <p className="auth-desc">Введите данные для входа в аккаунт</p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Логин"
              autoComplete="username"
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              autoComplete="current-password"
              required
            />
          </div>
          {enableCaptcha && captcha && (
            <div className="form-group captcha-group">
              <label>Подтверждение</label>
              <div className="captcha-row">
                <span className="captcha-question">{captcha.a} + {captcha.b} = ?</span>
                <input
                  type="number"
                  className="captcha-input"
                  value={captchaAnswer}
                  onChange={(e) => setCaptchaAnswer(e.target.value)}
                  placeholder="Ответ"
                  min="0"
                  max="99"
                  required={enableCaptcha}
                />
                <button type="button" className="captcha-refresh" onClick={loadCaptcha} title="Обновить">
                  ↻
                </button>
              </div>
            </div>
          )}
          <button type="submit" className="btn-primary auth-submit" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
        <p className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
