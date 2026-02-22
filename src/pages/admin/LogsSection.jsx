import { useState } from 'react';

function LogsSection({ logs, loadData }) {
  const [filter, setFilter] = useState('all');

  const filteredLogs = filter === 'all' ? logs : logs.filter(log => log.type === filter);

  const getLogIcon = (type) => {
    switch(type) {
      case 'info': return 'ℹ️';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '📋';
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Логи системы</h1>
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('all')}>Все</button>
          <button className={filter === 'info' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('info')}>Инфо</button>
          <button className={filter === 'warning' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('warning')}>Предупреждения</button>
          <button className={filter === 'success' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('success')}>Успешно</button>
          <button className={filter === 'error' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('error')}>Ошибки</button>
        </div>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Тип</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>IP адрес</th>
              <th>Дата и время</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? filteredLogs.map(log => (
              <tr key={log.id}>
                <td>{getLogIcon(log.type)}</td>
                <td><strong>{log.username || log.user_id || 'system'}</strong></td>
                <td>{log.action}</td>
                <td><code>{log.ip || '-'}</code></td>
                <td>{log.created_at ? new Date(log.created_at).toLocaleString() : '-'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Логов пока нет</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LogsSection;
