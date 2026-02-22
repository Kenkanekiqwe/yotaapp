import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

function NoticesSection({ notices, onAction, loadData }) {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    position: 'top',
    dismissible: true
  });

  const handleAddNotice = () => {
    setFormData({ title: '', message: '', type: 'info', position: 'top', dismissible: true });
    setEditingNotice(null);
    setShowAddModal(true);
  };

  const handleEditNotice = (notice) => {
    setFormData({
      title: notice.title,
      message: notice.message,
      type: notice.type || 'info',
      position: notice.position || 'top',
      dismissible: notice.dismissible !== 0
    });
    setEditingNotice(notice);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) {
      addToast('Заполните все поля', 'warning');
      return;
    }
    if (editingNotice) {
      await onAction('editNotice', editingNotice.id, {
        ...formData,
        dismissible: formData.dismissible,
        active: editingNotice.active !== 0
      });
    } else {
      await onAction('addNotice', null, formData);
    }
    setShowAddModal(false);
    loadData();
  };

  const handleDeleteNotice = async (id) => {
    await onAction('deleteNotice', id);
    loadData();
  };

  const toggleActive = async (notice) => {
    await onAction('toggleNotice', notice.id);
    loadData();
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Уведомления сайта</h1>
        <button className="btn-primary" onClick={handleAddNotice}>
          + Создать уведомление
        </button>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Заголовок</th>
              <th>Сообщение</th>
              <th>Позиция</th>
              <th>Закрываемое</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {notices.map(notice => (
              <tr key={notice.id}>
                <td>{notice.id}</td>
                <td>{getTypeIcon(notice.type)}</td>
                <td><strong>{notice.title}</strong></td>
                <td>{(notice.message || '').substring(0, 50)}...</td>
                <td>{notice.position === 'top' ? '⬆️ Верх' : '⬇️ Низ'}</td>
                <td>{notice.dismissible ? '✅' : '❌'}</td>
                <td>
                  <button 
                    className={`btn-small ${notice.active ? 'btn-success' : ''}`}
                    onClick={() => toggleActive(notice)}
                  >
                    {notice.active ? '✓ Активно' : '✗ Неактивно'}
                  </button>
                </td>
                <td>
                  <button className="btn-small" onClick={() => handleEditNotice(notice)}>
                    Изменить
                  </button>
                  <button className="btn-small btn-danger" onClick={() => handleDeleteNotice(notice.id)}>
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
            <h2>{editingNotice ? 'Редактировать уведомление' : 'Создать уведомление'}</h2>
            <div className="form-group">
              <label>Заголовок</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Заголовок уведомления"
              />
            </div>
            <div className="form-group">
              <label>Сообщение</label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Текст уведомления"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Тип</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="info">Информация</option>
                <option value="success">Успех</option>
                <option value="warning">Предупреждение</option>
                <option value="error">Ошибка</option>
              </select>
            </div>
            <div className="form-group">
              <label>Позиция</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              >
                <option value="top">Верх страницы</option>
                <option value="bottom">Низ страницы</option>
              </select>
            </div>
            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.dismissible}
                  onChange={(e) => setFormData({ ...formData, dismissible: e.target.checked })}
                />
                Можно закрыть
              </label>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSubmit}>
                {editingNotice ? 'Сохранить' : 'Создать'}
              </button>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoticesSection;
