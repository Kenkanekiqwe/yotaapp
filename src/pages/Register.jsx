import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const API = 'http://localhost:3001/api';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [enableCaptcha, setEnableCaptcha] = useState(true);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [captcha, setCaptcha] = useState(null);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const loadPublicSettings = async () => {
    try {
      const res = await fetch(`${API}/settings/public`);
      const data = await res.json();
      setEnableCaptcha(!!data.enableCaptcha);
      setRegistrationEnabled(!!data.registrationEnabled);
    } catch {
      setEnableCaptcha(true);
      setRegistrationEnabled(true);
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
    const result = await register(username, email, password, captchaPayload);
    setLoading(false);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Ошибка регистрации');
      if (enableCaptcha) loadCaptcha();
    }
  };

  if (!registrationEnabled) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <h1 className="auth-title">Регистрация</h1>
          <div className="auth-error">Регистрация временно отключена администрацией.</div>
          <p className="auth-footer">
            Уже есть аккаунт? <Link to="/login">Войти</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-desc">Создайте аккаунт для доступа к форуму и плагинам</p>
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
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Не менее 6 символов"
              autoComplete="new-password"
              minLength={6}
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
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>
        <p className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
