import { useState } from 'react';
import { useToast } from '../../context/ToastContext';

function PermissionsSection() {
  const { addToast } = useToast();
  const [permissions, setPermissions] = useState([
    { id: 1, group: 'Администраторы', canPost: true, canEdit: true, canDelete: true, canModerate: true, canManageUsers: true, canUpload: true, canViewReports: true },
    { id: 2, group: 'Модераторы', canPost: true, canEdit: true, canDelete: true, canModerate: true, canManageUsers: false, canUpload: true, canViewReports: true },
    { id: 3, group: 'VIP', canPost: true, canEdit: true, canDelete: false, canModerate: false, canManageUsers: false, canUpload: true, canViewReports: false },
    { id: 4, group: 'Пользователи', canPost: true, canEdit: true, canDelete: false, canModerate: false, canManageUsers: false, canUpload: false, canViewReports: false },
  ]);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const handleEdit = (perm) => {
    setEditingId(perm.id);
    setEditForm(perm);
  };

  const handleSave = () => {
    setPermissions(permissions.map(p => p.id === editingId ? editForm : p));
    setEditingId(null);
    addToast('Права доступа обновлены!', 'success');
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const togglePermission = (key) => {
    setEditForm({ ...editForm, [key]: !editForm[key] });
  };

  return (
    <div className="admin-section">
      <h1>Права доступа</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Управление правами доступа для групп пользователей
      </p>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Группа</th>
              <th>Создание постов</th>
              <th>Редактирование</th>
              <th>Удаление</th>
              <th>Модерация</th>
              <th>Управление пользователями</th>
              <th>Загрузка файлов</th>
              <th>Просмотр отчетов</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map(perm => (
              <tr key={perm.id}>
                {editingId === perm.id ? (
                  <>
                    <td><strong>{editForm.group}</strong></td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={editForm.canPost} 
                        onChange={() => togglePermission('canPost')}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={editForm.canEdit} 
                        onChange={() => togglePermission('canEdit')}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={editForm.canDelete} 
                        onChange={() => togglePermission('canDelete')}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={editForm.canModerate} 
                        onChange={() => togglePermission('canModerate')}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={editForm.canManageUsers} 
                        onChange={() => togglePermission('canManageUsers')}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={editForm.canUpload} 
                        onChange={() => togglePermission('canUpload')}
                      />
                    </td>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={editForm.canViewReports} 
                        onChange={() => togglePermission('canViewReports')}
                      />
                    </td>
                    <td>
                      <button className="btn-small btn-primary" onClick={handleSave}>Сохранить</button>
                      <button className="btn-small" onClick={handleCancel}>Отмена</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td><strong>{perm.group}</strong></td>
                    <td>{perm.canPost ? '✅' : '❌'}</td>
                    <td>{perm.canEdit ? '✅' : '❌'}</td>
                    <td>{perm.canDelete ? '✅' : '❌'}</td>
                    <td>{perm.canModerate ? '✅' : '❌'}</td>
                    <td>{perm.canManageUsers ? '✅' : '❌'}</td>
                    <td>{perm.canUpload ? '✅' : '❌'}</td>
                    <td>{perm.canViewReports ? '✅' : '❌'}</td>
                    <td>
                      <button className="btn-small" onClick={() => handleEdit(perm)}>Изменить</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PermissionsSection;
