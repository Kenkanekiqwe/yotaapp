import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

function WarningsSection({ warnings, users, onAction, loadData, currentUser }) {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ user: '', reason: '', points: 1, expires: '' });

  const handleAddWarning = async () => {
    if (!formData.user || !formData.reason) {
      addToast('Заполните все поля', 'warning');
      return;
    }
    await onAction('addWarning', null, {
      user_id: formData.user,
      reason: formData.reason,
      points: formData.points,
      expires_at: formData.expires || null,
      moderator_id: currentUser?.id || 1
    });
    setShowAddModal(false);
    setFormData({ user: '', reason: '', points: 1, expires: '' });
    loadData();
  };

  const handleDeleteWarning = async (id) => {
    await onAction('deleteWarning', id);
    loadData();
  };

  const handleExpireWarning = async (id) => {
    await onAction('expireWarning', id);
    loadData();
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Предупреждения</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          + Выдать предупреждение
        </button>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Пользователь</th>
              <th>Причина</th>
              <th>Баллы</th>
              <th>Истекает</th>
              <th>Модератор</th>
              <th>Дата</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {warnings.map(warning => (
              <tr key={warning.id}>
                <td>{warning.id}</td>
                <td><strong>{warning.user_name || warning.user_id}</strong></td>
                <td>{warning.reason}</td>
                <td><span style={{ color: warning.points >= 3 ? '#f44336' : '#ff9800' }}>{warning.points}</span></td>
                <td>{warning.expires_at || '-'}</td>
                <td>{warning.moderator_name || '-'}</td>
                <td>{warning.created_at ? new Date(warning.created_at).toLocaleDateString() : '-'}</td>
                <td>
                  {warning.active ? (
                    <span style={{ color: '#ff9800' }}>⚠️ Активно</span>
                  ) : (
                    <span style={{ color: '#666' }}>✓ Истекло</span>
                  )}
                </td>
                <td>
                  {warning.active && (
                    <button className="btn-small" onClick={() => handleExpireWarning(warning.id)}>
                      Истечь
                    </button>
                  )}
                  <button className="btn-small btn-danger" onClick={() => handleDeleteWarning(warning.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Выдать предупреждение</h2>
            <div className="form-group">
              <label>Пользователь</label>
              <input
                type="text"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                placeholder="Имя пользователя или ID"
              />
            </div>
            <div className="form-group">
              <label>Причина</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Опишите причину предупреждения"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Баллы (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
              />
              <small>При 5 баллах пользователь будет автоматически забанен</small>
            </div>
            <div className="form-group">
              <label>Истекает (дата)</label>
              <input
                type="date"
                value={formData.expires}
                onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAddWarning}>Выдать</button>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WarningsSection;
