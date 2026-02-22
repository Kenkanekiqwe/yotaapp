function PluginsSection({ plugins, onAction, onEdit }) {
  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Управление плагинами</h1>
        <button className="btn-primary" onClick={() => onEdit('addPlugin')}>+ Добавить плагин</button>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Автор</th>
              <th>Версия</th>
              <th>Загрузки</th>
              <th>Цена</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {plugins.map(plugin => (
              <tr key={plugin.id}>
                <td>{plugin.id}</td>
                <td><strong>{plugin.name}</strong></td>
                <td>{plugin.author_name}</td>
                <td>{plugin.version}</td>
                <td>{plugin.downloads}</td>
                <td>{plugin.price > 0 ? `${plugin.price}?` : 'Бесплатно'}</td>
                <td>{new Date(plugin.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn-small" onClick={() => onEdit('editPlugin', plugin)}>Изменить</button>
                  <button className="btn-small btn-danger" onClick={() => onAction('deletePlugin', plugin.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PluginsSection;
