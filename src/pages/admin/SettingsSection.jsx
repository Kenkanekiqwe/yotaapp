import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

function SettingsSection({ settings, onSave, loadData }) {
  const { addToast } = useToast();
  const [formSettings, setFormSettings] = useState({
    siteName: 'Yota Plugins',
    siteDescription: 'Магазин плагинов для Rust серверов',
    siteUrl: 'https://yota-plugins.ru',
    contactEmail: 'admin@yota-plugins.ru',
    registrationEnabled: true,
    maintenanceMode: localStorage.getItem('maintenanceMode') === 'true',
    postsPerPage: 20,
    threadsPerPage: 25,
    maxUploadSize: 10,
    allowGuestViewing: true,
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormSettings({
        siteName: settings.siteName || 'Yota Plugins',
        siteDescription: settings.siteDescription || '',
        siteUrl: settings.siteUrl || '',
        contactEmail: settings.contactEmail || '',
        registrationEnabled: settings.registrationEnabled !== '0',
        maintenanceMode: settings.maintenanceMode === '1' || localStorage.getItem('maintenanceMode') === 'true',
        postsPerPage: parseInt(settings.postsPerPage) || 20,
        threadsPerPage: parseInt(settings.threadsPerPage) || 25,
        maxUploadSize: parseInt(settings.maxUploadSize) || 10,
        allowGuestViewing: settings.allowGuestViewing !== '0',
      });
    }
  }, [settings]);

  const handleSave = async () => {
    const toSave = {
      siteName: formSettings.siteName,
      siteDescription: formSettings.siteDescription,
      siteUrl: formSettings.siteUrl,
      contactEmail: formSettings.contactEmail,
      registrationEnabled: formSettings.registrationEnabled ? '1' : '0',
      maintenanceMode: formSettings.maintenanceMode ? '1' : '0',
      postsPerPage: String(formSettings.postsPerPage),
      threadsPerPage: String(formSettings.threadsPerPage),
      allowGuestViewing: formSettings.allowGuestViewing ? '1' : '0',
    };
    localStorage.setItem('maintenanceMode', formSettings.maintenanceMode);
    await onSave('saveSettings', null, toSave);
    if (loadData) loadData();
    addToast('Настройки сохранены!', 'success');
    if (formSettings.maintenanceMode) {
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const toggleMaintenance = (enabled) => {
    setFormSettings({...formSettings, maintenanceMode: enabled});
    localStorage.setItem('maintenanceMode', enabled);
    if (enabled) {
      addToast('Режим обслуживания включен!', 'warning');
    } else {
      addToast('Режим обслуживания выключен!', 'success');
      window.location.reload();
    }
  };

  return (
    <div className="admin-section">
      <h1>Основные настройки</h1>
      
      <div className="settings-form">
        <div className="settings-group">
          <h3>Общие настройки</h3>
          <div className="form-group">
            <label>Название сайта</label>
            <input 
              type="text" 
              value={formSettings.siteName}
              onChange={(e) => setFormSettings({...formSettings, siteName: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Описание сайта</label>
            <textarea 
              value={formSettings.siteDescription}
              onChange={(e) => setFormSettings({...formSettings, siteDescription: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>URL сайта</label>
            <input 
              type="text" 
              value={formSettings.siteUrl}
              onChange={(e) => setFormSettings({...formSettings, siteUrl: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Email для связи</label>
            <input 
              type="email" 
              value={formSettings.contactEmail}
              onChange={(e) => setFormSettings({...formSettings, contactEmail: e.target.value})}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Настройки форума</h3>
          <div className="form-group">
            <label>Сообщений на странице</label>
            <input 
              type="number" 
              value={formSettings.postsPerPage}
              onChange={(e) => setFormSettings({...formSettings, postsPerPage: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Тем на странице</label>
            <input 
              type="number" 
              value={formSettings.threadsPerPage}
              onChange={(e) => setFormSettings({...formSettings, threadsPerPage: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Максимальный размер загрузки (МБ)</label>
            <input 
              type="number" 
              value={formSettings.maxUploadSize}
              onChange={(e) => setFormSettings({...formSettings, maxUploadSize: e.target.value})}
            />
          </div>
        </div>

        <div className="settings-group">
          <h3>Режимы работы</h3>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={formSettings.registrationEnabled}
                onChange={(e) => setFormSettings({...formSettings, registrationEnabled: e.target.checked})}
              />
              Разрешить регистрацию новых пользователей
            </label>
          </div>
          <div className="form-group checkbox-group">
            <label style={{ 
              color: formSettings.maintenanceMode ? '#ff9800' : 'inherit',
              fontWeight: formSettings.maintenanceMode ? 'bold' : 'normal'
            }}>
              <input 
                type="checkbox" 
                checked={formSettings.maintenanceMode}
                onChange={(e) => toggleMaintenance(e.target.checked)}
              />
              Режим обслуживания (сайт недоступен для пользователей)
            </label>
            {formSettings.maintenanceMode && (
              <small style={{ color: '#ff9800', display: 'block', marginTop: '0.5rem' }}>
                ⚠️ Режим обслуживания активен! Только администраторы могут просматривать сайт.
              </small>
            )}
          </div>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={formSettings.allowGuestViewing}
                onChange={(e) => setFormSettings({...formSettings, allowGuestViewing: e.target.checked})}
              />
              Разрешить просмотр гостям
            </label>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave}>Сохранить настройки</button>
      </div>
    </div>
  );
}

export default SettingsSection;
