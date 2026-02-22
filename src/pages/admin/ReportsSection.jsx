import { useState } from 'react';

function ReportsSection({ reports, onAction, loadData }) {
  const [filter, setFilter] = useState('all');

  const handleResolve = async (id) => {
    await onAction('resolveReport', id);
    loadData();
  };

  const handleReject = async (id) => {
    await onAction('rejectReport', id);
    loadData();
  };

  const handleDelete = async (id) => {
    await onAction('deleteReport', id);
    loadData();
  };

  const filteredReports = filter === 'all' 
    ? reports 
    : reports.filter(r => r.status === filter);

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span style={{ color: '#ff9800' }}>⏳ Ожидает</span>;
      case 'resolved': return <span style={{ color: '#4caf50' }}>✅ Решен</span>;
      case 'rejected': return <span style={{ color: '#f44336' }}>❌ Отклонен</span>;
      default: return status;
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Отчеты пользователей</h1>
        <div className="filter-buttons">
          <button className={filter === 'all' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('all')}>
            Все ({reports.length})
          </button>
          <button className={filter === 'pending' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('pending')}>
            Ожидают ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button className={filter === 'resolved' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('resolved')}>
            Решены ({reports.filter(r => r.status === 'resolved').length})
          </button>
          <button className={filter === 'rejected' ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter('rejected')}>
            Отклонены ({reports.filter(r => r.status === 'rejected').length})
          </button>
        </div>
      </div>
      
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Тип</th>
              <th>Содержание</th>
              <th>Отправитель</th>
              <th>Нарушитель</th>
              <th>Статус</th>
              <th>Дата</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map(report => (
              <tr key={report.id}>
                <td>{report.id}</td>
                <td>{report.type === 'post' ? '📝 Пост' : '👤 Пользователь'}</td>
                <td>{report.content_summary || '-'}</td>
                <td><strong>{report.reporter_name || report.reporter_id}</strong></td>
                <td><strong>{report.reported_name || report.reported_id || '-'}</strong></td>
                <td>{getStatusBadge(report.status)}</td>
                <td>{report.created_at ? new Date(report.created_at).toLocaleString() : '-'}</td>
                <td>
                  {report.status === 'pending' && (
                    <>
                      <button className="btn-small btn-success" onClick={() => handleResolve(report.id)}>
                        Решить
                      </button>
                      <button className="btn-small btn-danger" onClick={() => handleReject(report.id)}>
                        Отклонить
                      </button>
                    </>
                  )}
                  <button className="btn-small" onClick={() => window.open(`/thread/${report.content_id}`, '_blank')}>
                    Просмотр
                  </button>
                  <button className="btn-small btn-danger" onClick={() => handleDelete(report.id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ReportsSection;
