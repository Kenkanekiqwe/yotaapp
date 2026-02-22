function UsersSection({ users, onAction, onEdit }) {
  if (!users || users.length === 0) {
    return (
      <div className="admin-section">
        <h1>Управление пользователями</h1>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>Нет пользователей для отображения</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Управление пользователями</h1>
        <div className="header-actions">
          <input type="text" placeholder="Поиск пользователей..." className="search-input" />
          <button className="btn-secondary">Фильтр</button>
        </div>
      </div>
      
      <div className="data-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => {
              let badges = [];
              try {
                badges = user.badges ? JSON.parse(user.badges) : [];
              } catch (e) {
                badges = [];
              }
              
              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>
                    {user.username}
                    {badges.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                        {badges.map((badge, idx) => (
                          <span key={idx} style={{ 
                            backgroundColor: badge.color || '#666', 
                            color: 'white', 
                            padding: '2px 8px', 
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                          }}>
                            {badge.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role === 'admin' && '?? Администратор'}
                      {user.role === 'moderator' && '??? Модератор'}
                      {user.role === 'user' && '?? Пользователь'}
                    </span>
                  </td>
                  <td>{user.banned ? '?? Забанен' : '? Активен'}</td>
                  <td>
                    <div className="admin-actions">
                      <button className="admin-btn admin-btn-edit" onClick={() => onEdit('editUser', user)}>
                        Редактировать
                      </button>
                      <button 
                        className="admin-btn admin-btn-ban" 
                        onClick={() => onAction('banUser', user.id, { reason: 'Нарушение правил' })}
                      >
                        {user.banned ? 'Разбанить' : 'Забанить'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UsersSection;
