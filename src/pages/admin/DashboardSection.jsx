function DashboardSection({ stats, onAction, onNavigate }) {
  return (
    <div className="admin-section">
      <h1>Панель управления</h1>
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <div className="stat-value">{stats.threads || 0}</div>
            <div className="stat-label">Тем</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-value">{stats.posts || 0}</div>
            <div className="stat-label">Сообщений</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.users || 0}</div>
            <div className="stat-label">Пользователей</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔌</div>
          <div className="stat-info">
            <div className="stat-value">{stats.plugins || 0}</div>
            <div className="stat-label">Плагинов</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <div className="stat-value">{stats.online || 0}</div>
            <div className="stat-label">Онлайн</div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-info">
        <div className="info-card">
          <h3>Быстрые действия</h3>
          <div className="quick-actions">
            <button className="action-btn" onClick={() => window.location.href = '/forum'}>📝 Создать тему</button>
            <button className="action-btn" onClick={() => onAction && onAction()}>🔧 Обновить данные</button>
            <button className="action-btn" onClick={() => onNavigate && onNavigate('logs')}>📊 Просмотр логов</button>
            <button className="action-btn" onClick={() => onAction && onAction()}>🔄 Обновить статистику</button>
          </div>
        </div>
        
        <div className="info-card">
          <h3>Системная информация</h3>
          <div className="system-info">
            <div className="info-row">
              <span>Версия:</span>
              <span>Yota Plugins 1.0.0</span>
            </div>
            <div className="info-row">
              <span>Платформа:</span>
              <span>React + Vite</span>
            </div>
            <div className="info-row">
              <span>База данных:</span>
              <span>SQLite</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardSection;
