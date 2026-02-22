import { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';

function AppearanceSection({ onAction }) {
  const { addToast } = useToast();
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  const themes = [
    { 
      id: 'dark', 
      name: 'Темная тема', 
      colors: { header: '#20232e', content: '#1a1d29' },
      description: 'Классическая темная тема Oxide Russia'
    },
    { 
      id: 'light', 
      name: 'Светлая тема', 
      colors: { header: '#f5f5f5', content: '#ffffff' },
      description: 'Светлая тема для дневного использования'
    },
    { 
      id: 'blue', 
      name: 'Синяя тема', 
      colors: { header: '#1e3a5f', content: '#2c5282' },
      description: 'Глубокая синяя тема'
    },
    { 
      id: 'green', 
      name: 'Зеленая тема', 
      colors: { header: '#1e4620', content: '#2d5a2e' },
      description: 'Природная зеленая тема'
    },
    { 
      id: 'purple', 
      name: 'Фиолетовая тема', 
      colors: { header: '#2d1b3d', content: '#1a0f26' },
      description: 'Мистическая фиолетовая тема'
    },
    { 
      id: 'red', 
      name: 'Красная тема', 
      colors: { header: '#3d1b1b', content: '#260f0f' },
      description: 'Агрессивная красная тема'
    },
    { 
      id: 'orange', 
      name: 'Оранжевая тема', 
      colors: { header: '#3d2a1b', content: '#261a0f' },
      description: 'Теплая оранжевая тема'
    },
    { 
      id: 'gray', 
      name: 'Серая тема', 
      colors: { header: '#2a2a2a', content: '#1f1f1f' },
      description: 'Нейтральная серая тема'
    },
    { 
      id: 'amoled', 
      name: 'AMOLED Black', 
      colors: { header: '#000000', content: '#0a0a0a' },
      description: 'Полностью черная тема для AMOLED экранов'
    },
    { 
      id: 'cyberpunk', 
      name: 'Cyberpunk', 
      colors: { header: '#0f0f23', content: '#1a1a2e' },
      description: 'Киберпанк тема с неоновыми акцентами'
    },
  ];

  const applyTheme = (themeId) => {
    // Удаляем старый атрибут темы
    document.documentElement.removeAttribute('data-theme');
    
    // Применяем новую тему (если не темная по умолчанию)
    if (themeId !== 'dark') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    
    // Сохраняем в localStorage
    localStorage.setItem('theme', themeId);
    setActiveTheme(themeId);
    
    // Показываем уведомление
    addToast(`Тема "${themes.find(t => t.id === themeId)?.name}" активирована!`, 'success');
  };

  // Применяем сохраненную тему при загрузке
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && savedTheme !== 'dark') {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  return (
    <div className="admin-section">
      <h1>Темы оформления</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Тема меняется в шапке сайта. Здесь можно превью или задать тему по умолчанию.
      </p>
      <div className="styles-grid">
        {themes.map(theme => (
          <div key={theme.id} className={`style-card ${activeTheme === theme.id ? 'active-style' : ''}`}>
            <div className="style-preview">
              <div className="preview-header" style={{ background: theme.colors.header }}></div>
              <div className="preview-content" style={{ background: theme.colors.content }}></div>
            </div>
            <h3>{theme.name}</h3>
            <p>{theme.description}</p>
            <div className="style-actions">
              {activeTheme === theme.id ? (
                <button className="btn-success" disabled>
                  ✓ Активна
                </button>
              ) : (
                <button 
                  className="btn-primary"
                  onClick={() => applyTheme(theme.id)}
                >
                  Активировать
                </button>
              )}
              <button className="btn-secondary" onClick={() => addToast('Настройка темы будет доступна в следующей версии', 'info')}>
                Настроить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AppearanceSection;
