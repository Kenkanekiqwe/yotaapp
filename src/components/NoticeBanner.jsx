import { useState, useEffect } from 'react';
import './NoticeBanner.css';

function NoticeBanner() {
  const [notices, setNotices] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/notices')
      .then(r => r.json())
      .then(data => setNotices(Array.isArray(data) ? data : []))
      .catch(() => setNotices([]));
  }, []);

  const getNoticeClass = (type) => {
    switch (type) {
      case 'success': return 'notice-success';
      case 'warning': return 'notice-warning';
      case 'error': return 'notice-error';
      default: return 'notice-info';
    }
  };

  if (!notices || notices.length === 0) return null;

  return (
    <div className="notice-banner-container">
      {notices.map(notice => (
        <div
          key={notice.id}
          className={`notice-banner ${getNoticeClass(notice.type)} notice-${notice.position || 'top'}`}
        >
          <div className="notice-content">
            <strong>{notice.title}</strong>
            <span>{notice.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default NoticeBanner;
