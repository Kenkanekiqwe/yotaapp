import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

function ModeratorsSection({ moderators, users, onAction, loadData }) {
  const { addToast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMod, setEditingMod] = useState(null);
  const [formData, setFormData] = useState({ username: '', role: 'Модератор', category_ids: '', active: true });

  const handleAddModerator = () => {
    setFormData({ username: '', role: 'Модератор', category_ids: '', active: true });
    setEditingMod(null);
    setShowAddModal(true);
  };

  const handleEditModerator = (mod) => {
    setFormData({ username: mod.username, role: mod.role, category_ids: mod.category_ids || '', active: mod.active !== 0 });
    setEditingMod(mod);
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.username) {
      addToast('Введите имя пользователя', 'warning');
      return;
    }
    const user = users.find(u => u.username === formData.username);
    const userId = user ? user.id : formData.username;
    if (editingMod) {
      await onAction('editModerator', editingMod.id, { role: formData.role, category_ids: formData.category_ids || null, active: formData.active });
    } else {
      await onAction('addModerator', null, { user_id: userId, role: formData.role, category_ids: formData.category_ids || null });
    }
    setShowAddModal(false);
    loadData();
  };

  const handleDeleteModerator = async (id) => {
    await onAction('deleteModerator', id);
    loadData();
  };

  const toggleActive = async (mod) => {
    await onAction('editModerator', mod.id, { role: mod.role, category_ids: mod.category_ids, active: mod.active ? 0 : 1 });
    loadData();
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Модераторы</h1>
        <button className="btn-primary" onClick={handleAddModerator}>+ Добавить модератора</button>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Пользователь</th>
              <th>Роль</th>
              <th>Категории</th>
              <th>Модератор с</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {moderators.map(mod => (
              <tr key={mod.id}>
                <td>{mod.id}</td>
                <td><strong>{mod.username}</strong></td>
                <td>{mod.role}</td>
                <td>{mod.category_ids || 'Все категории'}</td>
                <td>{mod.created_at ? new Date(mod.created_at).toLocaleDateString() : '-'}</td>
                <td>
                  <button 
                    className={`btn-small ${mod.active ? 'btn-success' : ''}`}
                    onClick={() => toggleActive(mod)}
                  >
                    {mod.active ? '✓ Активен' : '✗ Неактивен'}
                  </button>
                </td>
                <td>
                  <button className="btn-small" onClick={() => handleEditModerator(mod)}>Изменить</button>
                  <button className="btn-small btn-danger" onClick={() => handleDeleteModerator(mod.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingMod ? 'Редактировать модератора' : 'Добавить модератора'}</h2>
            <div className="form-group">
              <label>Имя пользователя</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Введите имя пользователя"
                disabled={!!editingMod}
              />
            </div>
            <div className="form-group">
              <label>Роль</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="Модератор">Модератор</option>
                <option value="Старший модератор">Старший модератор</option>
                <option value="Супермодератор">Супермодератор</option>
              </select>
            </div>
            <div className="form-group">
              <label>Категории (ID через запятую, пусто = все)</label>
              <input
                type="text"
                value={formData.category_ids}
                onChange={(e) => setFormData({ ...formData, category_ids: e.target.value })}
                placeholder="1,2,3"
              />
            </div>
            {editingMod && (
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  Активен
                </label>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleSubmit}>
                {editingMod ? 'Сохранить' : 'Добавить'}
              </button>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModeratorsSection;
