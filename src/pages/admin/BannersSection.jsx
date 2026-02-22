function BannersSection({ banners, onAction, onEdit }) {
  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Управление баннерами</h1>
        <button className="btn-primary" onClick={() => onEdit('addBanner')}>+ Добавить баннер</button>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Название</th>
              <th>Изображение</th>
              <th>Ссылка</th>
              <th>Позиция</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {banners.map(banner => (
              <tr key={banner.id}>
                <td>{banner.id}</td>
                <td><strong>{banner.title}</strong></td>
                <td><img src={banner.image_url} alt={banner.title} style={{ maxWidth: '100px', height: 'auto' }} /></td>
                <td><a href={banner.url} target="_blank" rel="noopener noreferrer">{banner.url}</a></td>
                <td>{banner.position}</td>
                <td>{banner.active ? '? Активен' : '? Неактивен'}</td>
                <td>
                  <button className="btn-small" onClick={() => onEdit('editBanner', banner)}>Изменить</button>
                  <button className="btn-small btn-danger" onClick={() => onAction('deleteBanner', banner.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default BannersSection;
