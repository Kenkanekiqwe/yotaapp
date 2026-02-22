function ThreadsSection({ threads, onAction, onEdit }) {
  if (!threads || threads.length === 0) {
    return (
      <div className="admin-section">
        <div className="section-header">
          <h1>Темы и сообщения</h1>
          <button className="btn-primary">Создать тему</button>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>Нет тем для отображения. Создайте первую тему через форум.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Темы и сообщения</h1>
        <div className="header-actions">
          <input type="text" placeholder="Поиск тем..." className="search-input" />
          <button className="btn-secondary">Фильтр</button>
        </div>
      </div>
      
      <div className="data-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Автор</th>
              <th>Просмотры</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {threads.map(thread => (
              <tr key={thread.id}>
                <td>{thread.id}</td>
                <td>{thread.title}</td>
                <td>{thread.author_name}</td>
                <td>{thread.views}</td>
                <td>
                  {thread.pinned ? '📌 ' : ''}
                  {thread.locked ? '🔒 ' : ''}
                  {thread.hidden ? '👁️‍🗨️ ' : ''}
                  {!thread.pinned && !thread.locked && !thread.hidden && '✅ Обычная'}
                </td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-btn admin-btn-edit" onClick={() => onEdit('editThread', thread)}>
                      Редактировать
                    </button>
                    <button 
                      className="admin-btn admin-btn-edit" 
                      onClick={() => onAction('pinThread', thread.id)}
                    >
                      {thread.pinned ? 'Открепить' : 'Закрепить'}
                    </button>
                    <button 
                      className="admin-btn admin-btn-ban" 
                      onClick={() => onAction('lockThread', thread.id)}
                    >
                      {thread.locked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                    <button 
                      className="admin-btn admin-btn-delete" 
                      onClick={() => onAction('deleteThread', thread.id)}
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

export default ThreadsSection;
