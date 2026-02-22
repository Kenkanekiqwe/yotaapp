import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

function SecuritySection() {
  const { addToast } = useToast();
  const [securitySettings, setSecuritySettings] = useState({
    enableCaptcha: true,
    enableTwoFactor: false,
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableIpBan: true,
    enableFloodProtection: true,
    floodInterval: 10,
  });

  const [bannedIps] = useState([
    { ip: '192.168.1.100', reason: 'Спам', date: '2024-01-15' },
  ]);

  const handleSave = () => {
    addToast('Настройки безопасности сохранены!', 'success');
  };

  const handleAddBannedIp = () => {
    addToast('Добавление IP перенесено в отдельную форму (без browser prompt).', 'info');
  };

  return (
    <div className="admin-section">
      <h1>Безопасность</h1>
      
      <div className="settings-form">
        <div className="settings-group">
          <h3>Защита от ботов</h3>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={securitySettings.enableCaptcha}
                onChange={(e) => setSecuritySettings({...securitySettings, enableCaptcha: e.target.checked})}
              />
              Включить CAPTCHA при регистрации
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={securitySettings.enableFloodProtection}
                onChange={(e) => setSecuritySettings({...securitySettings, enableFloodProtection: e.target.checked})}
              />
              Защита от флуда
            </label>
          </div>
          <div className="form-group">
            <label>Интервал между сообщениями (секунды)</label>
            <input 
              type="number" 
              value={securitySettings.floodInterval}
              onChange={(e) => setSecuritySettings({...securitySettings, floodInterval: e.target.value})}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Аутентификация</h3>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={securitySettings.enableTwoFactor}
                onChange={(e) => setSecuritySettings({...securitySettings, enableTwoFactor: e.target.checked})}
              />
              Двухфакторная аутентификация
            </label>
          </div>
          <div className="form-group">
            <label>Минимальная длина пароля</label>
            <input 
              type="number" 
              value={securitySettings.passwordMinLength}
              onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Таймаут сессии (минуты)</label>
            <input 
              type="number" 
              value={securitySettings.sessionTimeout}
              onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Максимум попыток входа</label>
            <input 
              type="number" 
              value={securitySettings.maxLoginAttempts}
              onChange={(e) => setSecuritySettings({...securitySettings, maxLoginAttempts: e.target.value})}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Блокировка IP</h3>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={securitySettings.enableIpBan}
                onChange={(e) => setSecuritySettings({...securitySettings, enableIpBan: e.target.checked})}
              />
              Включить блокировку по IP
            </label>
          </div>
          
          <button className="btn-secondary" onClick={handleAddBannedIp}>+ Добавить IP в черный список</button>
          
          <table className="admin-table" style={{ marginTop: '15px' }}>
            <thead>
              <tr>
                <th>IP адрес</th>
                <th>Причина</th>
                <th>Дата</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {bannedIps.map((ban, idx) => (
                <tr key={idx}>
                  <td><code>{ban.ip}</code></td>
                  <td>{ban.reason}</td>
                  <td>{ban.date}</td>
                  <td>
                    <button className="btn-small btn-danger">Разблокировать</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn-primary" onClick={handleSave}>Сохранить настройки</button>
      </div>
    </div>
  );
}

export default SecuritySection;
