function GroupsSection({ groups, onAction, onEdit }) {
  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Группы пользователей</h1>
        <button className="btn-primary" onClick={() => onEdit('addGroup', {})}>
          Создать группу
        </button>
      </div>
      
      <div className="data-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Цвет</th>
              <th>Участников</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <tr key={group.id}>
                <td>{group.id}</td>
                <td>
                  <span style={{ 
                    backgroundColor: group.color, 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {group.name}
                  </span>
                </td>
                <td>
                  <div style={{ 
                    width: '30px', 
                    height: '30px', 
                    backgroundColor: group.color, 
                    borderRadius: '4px',
                    border: '1px solid var(--border)'
                  }} />
                </td>
                <td>{group.members}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-btn admin-btn-edit" onClick={() => onEdit('editGroup', group)}>
                      Редактировать
                    </button>
                    <button className="admin-btn admin-btn-edit">Права</button>
                    <button 
                      className="admin-btn admin-btn-delete" 
                      onClick={() => onAction('deleteGroup', group.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default GroupsSection;
