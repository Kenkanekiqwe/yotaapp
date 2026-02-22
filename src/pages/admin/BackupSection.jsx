import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { API_URL } from '../../config';


function BackupSection({ backups, onAction, loadData }) {
  const { addToast } = useToast();
  const [autoBackup, setAutoBackup] = useState(false);
  const [frequency, setFrequency] = useState('daily');
  const [retentionDays, setRetentionDays] = useState(30);

  const handleCreateBackup = async () => {
    await onAction('createBackup', null);
    if (loadData) loadData();
    addToast('Резервная копия создана!', 'success');
  };

  const handleDownloadBackup = (name) => {
    window.open(`${API_URL}/admin/backup/download?name=${encodeURIComponent(name)}`, '_blank');
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Резервное копирование</h1>
        <button className="btn-primary" onClick={handleCreateBackup}>💾 Создать резервную копию</button>
      </div>
      
      <div className="settings-form">
        <div className="settings-group">
          <h3>Автоматическое резервное копирование</h3>
          <div className="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                checked={autoBackup} 
                onChange={(e) => setAutoBackup(e.target.checked)}
              />
              Включить автоматическое резервное копирование
            </label>
          </div>
          <div className="form-group">
            <label>Частота создания резервных копий</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="daily">Ежедневно</option>
              <option value="weekly">Еженедельно</option>
              <option value="monthly">Ежемесячно</option>
            </select>
          </div>
          <div className="form-group">
            <label>Хранить резервные копии (дней)</label>
            <input 
              type="number" 
              value={retentionDays} 
              onChange={(e) => setRetentionDays(parseInt(e.target.value) || 30)}
            />
          </div>
        </div>
      </div>

      <h2 style={{ marginTop: '30px' }}>Доступные резервные копии</h2>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Размер</th>
              <th>Дата создания</th>
              <th>Тип</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {backups && backups.length > 0 ? backups.map((backup, idx) => (
              <tr key={idx}>
                <td><code>{backup.name}</code></td>
                <td>{backup.size}</td>
                <td>{backup.date ? new Date(backup.date).toLocaleString() : '-'}</td>
                <td>{backup.type === 'auto' ? '🤖 Авто' : '👤 Ручная'}</td>
                <td>
                  <button className="btn-small" onClick={() => handleDownloadBackup(backup.name)}>Скачать</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Резервных копий пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BackupSection;
