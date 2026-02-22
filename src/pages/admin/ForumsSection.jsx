import { useState } from 'react';
import { API_URL } from '../../config';


function ForumsSection({ categories, onEdit }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '💬' });

  const handleAddCategory = async () => {
    if (!formData.name.trim()) return;
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    await fetch(`${API_URL}/admin/addCategory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name, slug, description: formData.description, icon: formData.icon })
    });
    setShowAddModal(false);
    window.location.reload();
  };

  const handleDeleteCategory = async (id) => {
    await fetch(`${API_URL}/admin/deleteCategory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: id })
    });
    window.location.reload();
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Форумы и категории</h1>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Добавить категорию</button>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Иконка</th>
              <th>Название</th>
              <th>Slug</th>
              <th>Описание</th>
              <th>Темы</th>
              <th>Сообщения</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td>{cat.id}</td>
                <td style={{ fontSize: '24px' }}>{cat.icon}</td>
                <td><strong>{cat.name}</strong></td>
                <td><code>{cat.slug}</code></td>
                <td>{cat.description}</td>
                <td>{cat.thread_count || 0}</td>
                <td>{cat.post_count || 0}</td>
                <td>
                  <button className="btn-small" onClick={() => onEdit('editCategory', cat)}>Изменить</button>
                  <button className="btn-small btn-danger" onClick={() => handleDeleteCategory(cat.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новая категория</h2>
            <div className="form-group">
              <label>Название</label>
              <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="оставьте пустым для авто" />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Иконка</label>
              <input value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleAddCategory}>Создать</button>
              <button className="btn-secondary" onClick={() => setShowAddModal(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForumsSection;
