import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

function EmailSection() {
  const { addToast } = useToast();
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@yota-plugins.ru',
    smtpPassword: '',
    fromEmail: 'noreply@yota-plugins.ru',
    fromName: 'Yota Plugins',
    enableNotifications: true,
    enableDigest: false,
  });

  const handleSave = () => {
    addToast('Email настройки сохранены!', 'success');
  };

  const handleTestEmail = () => {
    addToast('Тестовое письмо отправлено!', 'success');
  };

  return (
    <div className="admin-section">
      <h1>Email настройки</h1>
      
      <div className="settings-form">
        <div className="settings-group">
          <h3>SMTP настройки</h3>
          <div className="form-group">
            <label>SMTP хост</label>
            <input 
              type="text" 
              value={emailSettings.smtpHost}
              onChange={(e) => setEmailSettings({...emailSettings, smtpHost: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>SMTP порт</label>
            <input 
              type="number" 
              value={emailSettings.smtpPort}
              onChange={(e) => setEmailSettings({...emailSettings, smtpPort: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>SMTP пользователь</label>
            <input 
              type="text" 
              value={emailSettings.smtpUser}
              onChange={(e) => setEmailSettings({...emailSettings, smtpUser: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>SMTP пароль</label>
            <input 
              type="password" 
              value={emailSettings.smtpPassword}
              onChange={(e) => setEmailSettings({...emailSettings, smtpPassword: e.target.value})}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Настройки отправителя</h3>
          <div className="form-group">
            <label>Email отправителя</label>
            <input 
              type="email" 
              value={emailSettings.fromEmail}
              onChange={(e) => setEmailSettings({...emailSettings, fromEmail: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Имя отправителя</label>
            <input 
              type="text" 
              value={emailSettings.fromName}
              onChange={(e) => setEmailSettings({...emailSettings, fromName: e.target.value})}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Уведомления</h3>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={emailSettings.enableNotifications}
                onChange={(e) => setEmailSettings({...emailSettings, enableNotifications: e.target.checked})}
              />
              Включить email уведомления
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={emailSettings.enableDigest}
                onChange={(e) => setEmailSettings({...emailSettings, enableDigest: e.target.checked})}
              />
              Отправлять дайджест активности
            </label>
          </div>
        </div>

        <div className="button-group">
          <button className="btn-primary" onClick={handleSave}>Сохранить настройки</button>
          <button className="btn-secondary" onClick={handleTestEmail}>Отправить тестовое письмо</button>
        </div>
      </div>
    </div>
  );
}

export default EmailSection;
