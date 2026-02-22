import './BanScreen.css'

function BanScreen({ banInfo, onClose }) {
  const formatDate = (str) => {
    if (!str) return '—';
    try {
      const d = new Date(str);
      return d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch { return str; }
  };

  return (
    <div className="ban-screen">
      <div className="ban-screen-overlay" />
      <div className="ban-screen-card">
        <div className="ban-screen-icon">🚫</div>
        <h1>Аккаунт заблокирован</h1>
        <p className="ban-screen-subtitle">Доступ к сайту ограничен</p>
        <div className="ban-info-list">
          <div className="ban-info-row">
            <span className="ban-info-label">Заблокировал:</span>
            <span className="ban-info-value">{banInfo?.bannedBy || '—'}</span>
          </div>
          <div className="ban-info-row">
            <span className="ban-info-label">Дата:</span>
            <span className="ban-info-value">{formatDate(banInfo?.createdAt)}</span>
          </div>
          <div className="ban-info-row">
            <span className="ban-info-label">Причина:</span>
            <span className="ban-info-value ban-reason">{banInfo?.reason || 'Не указана'}</span>
          </div>
          <div className="ban-info-row">
            <span className="ban-info-label">Разбан:</span>
            <span className="ban-info-value ban-expires">По решению администрации</span>
          </div>
        </div>
        <p className="ban-screen-note">
          Если вы считаете, что бан был выдан ошибочно, обратитесь к администрации сайта.
        </p>
        <button type="button" className="btn-secondary ban-close-btn" onClick={onClose}>
          Выйти
        </button>
      </div>
    </div>
  )
}

export default BanScreen
