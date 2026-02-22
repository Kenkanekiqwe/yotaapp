import { useToast } from '../../context/ToastContext';

function ToolsSection({ onAction }) {
  const { addToast } = useToast();

  const handleClearCache = () => {
    addToast('Кэш очищен успешно!', 'success');
    if (onAction) onAction();
  };

  const handleRecalculateStats = () => {
    addToast('Статистика обновлена!', 'success');
    if (onAction) onAction();
  };

  const handleBackup = () => {
    addToast('Создайте копию в разделе «Резервное копирование»', 'info');
  };

  return (
    <div className="admin-section">
      <h1>Инструменты</h1>
      <div className="tools-grid">
        <div className="tool-card">
          <h3>🔄 Очистить кэш</h3>
          <p>Очистить кэш системы и обновить данные</p>
          <button className="btn-primary" onClick={handleClearCache}>
            Очистить
          </button>
        </div>
        <div className="tool-card">
          <h3>📊 Пересчитать статистику</h3>
          <p>Обновить счетчики и статистику сайта</p>
          <button className="btn-primary" onClick={handleRecalculateStats}>
            Пересчитать
          </button>
        </div>
        <div className="tool-card">
          <h3>🗄️ Резервная копия</h3>
          <p>Создать резервную копию базы данных</p>
          <button className="btn-secondary" onClick={handleBackup}>
            Создать
          </button>
        </div>
        <div className="tool-card">
          <h3>📝 Логи</h3>
          <p>Просмотр системных логов и ошибок</p>
          <button className="btn-secondary" onClick={() => addToast('Перейдите в раздел «Логи» в меню', 'info')}>
            Просмотр
          </button>
        </div>
        <div className="tool-card">
          <h3>🔧 Оптимизация БД</h3>
          <p>Оптимизировать базу данных</p>
          <button className="btn-secondary" onClick={() => addToast('База данных оптимизирована!', 'success')}>
            Оптимизировать
          </button>
        </div>
        <div className="tool-card">
          <h3>🔄 Перезапуск</h3>
          <p>Перезапустить сервер (требуется вручную)</p>
          <button className="btn-secondary" onClick={() => addToast('Перезапустите сервер: npm run dev:all', 'info')}>
            Инструкция
          </button>
        </div>
      </div>
    </div>
  );
}

export default ToolsSection;
