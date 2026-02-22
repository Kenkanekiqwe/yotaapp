import { useState, useRef, useEffect } from 'react';

function AdminModal({ type, item, onClose, onSubmit }) {
  const defaultBanner = type === 'addBanner' && !item ? { active: 1, position: 'top' } : {};
  const [formData, setFormData] = useState(() => ({ ...defaultBanner, ...(item || {}) }));
  const bannerFileRef = useRef(null);

  useEffect(() => {
    if (type === 'addBanner' && !item) setFormData((prev) => ({ ...prev, active: 1, position: 'top' }));
  }, [type, item]);
  const [tags, setTags] = useState(item?.tags || []);
  const [newTag, setNewTag] = useState('');
  
  const [badges, setBadges] = useState(() => {
    if (item?.badges) {
      try {
        return typeof item.badges === 'string' ? JSON.parse(item.badges) : item.badges;
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [newBadgeText, setNewBadgeText] = useState('');
  const [newBadgeColor, setNewBadgeColor] = useState('#666666');
  const [newBadgeColor2, setNewBadgeColor2] = useState('#ffffff');
  const [newBadgeShimmer, setNewBadgeShimmer] = useState(false);
  const [bannerError, setBannerError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setBannerError('');
    if ((type === 'addBanner' || type === 'editBanner') && !formData.image_url?.trim()) {
      setBannerError('Добавьте изображение: вставьте URL или нажмите «Загрузить файл».');
      return;
    }
    if (type === 'editUser') {
      onSubmit(type, item?.id, { ...formData, badges });
    } else if (type.includes('Group')) {
      onSubmit(type, item?.id, formData);
    } else if (type === 'editBanner' || type === 'addBanner') {
      onSubmit(type, item?.id, formData);
    } else if (type === 'editCategory') {
      onSubmit('editCategory', item?.id, formData);
    } else if (type === 'editPlugin' || type === 'addPlugin') {
      onSubmit(type, item?.id, formData);
    } else {
      onSubmit(type, item?.id, { ...formData, tags });
    }
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  const addBadge = () => {
    if (newBadgeText.trim()) {
      setBadges([...badges, { text: newBadgeText.trim(), color: newBadgeColor, shimmer: newBadgeShimmer, shimmerColor2: newBadgeColor2 }]);
      setNewBadgeText('');
      setNewBadgeColor('#666666');
      setNewBadgeColor2('#ffffff');
      setNewBadgeShimmer(false);
    }
  };

  const toggleBadgeShimmer = (index) => {
    setBadges(badges.map((b, i) => i === index ? { ...b, shimmer: !b.shimmer } : b));
  };
  
  const removeBadge = (index) => {
    setBadges(badges.filter((_, i) => i !== index));
  };

  const onBannerFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setFormData((prev) => ({ ...prev, image_url: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const getModalTitle = () => {
    switch(type) {
      case 'editThread': return 'Редактировать тему';
      case 'banUser': return 'Забанить пользователя';
      case 'editUser': return 'Редактировать пользователя';
      case 'editPlugin': return 'Редактировать плагин';
      case 'addPlugin': return 'Добавить плагин';
      case 'editCategory': return 'Редактировать категорию';
      case 'addBanner': return 'Добавить баннер';
      case 'editBanner': return 'Редактировать баннер';
      case 'addGroup': return 'Создать группу';
      case 'editGroup': return 'Редактировать группу';
      default: return 'Редактирование';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{getModalTitle()}</h2>
        <form onSubmit={handleSubmit}>
          {type === 'editThread' && (
            <>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Теги</label>
                <div className="tag-input-container">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Добавить тег"
                  />
                  <button type="button" className="btn-primary" onClick={addTag}>
                    Добавить
                  </button>
                </div>
                <div className="tag-list">
                  {tags.map(tag => (
                    <div key={tag} className="tag-item">
                      {tag}
                      <button type="button" className="tag-remove" onClick={() => removeTag(tag)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {type === 'banUser' && (
            <div className="form-group">
              <label>Причина бана</label>
              <textarea
                value={formData.reason || ''}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows="4"
                placeholder="Укажите причину бана..."
              />
            </div>
          )}
          
          {type === 'editUser' && (
            <>
              <div className="form-group">
                <label>Роль</label>
                <select
                  value={formData.role || 'user'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user">Пользователь</option>
                  <option value="moderator">Модератор</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              <div className="form-group">
                <label>Бейджи</label>
                <div className="badge-input-container">
                  <input
                    type="text"
                    value={newBadgeText}
                    onChange={(e) => setNewBadgeText(e.target.value)}
                    placeholder="Текст бейджа"
                  />
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      id="badge-color-1"
                      value={newBadgeColor}
                      onChange={(e) => setNewBadgeColor(e.target.value)}
                    />
                    <label className="color-picker-btn" htmlFor="badge-color-1">
                      <span className="color-swatch" style={{ backgroundColor: newBadgeColor }} />
                      Цвет
                    </label>
                  </div>
                  <div className="color-picker-wrap">
                    <input
                      type="color"
                      id="badge-color-2"
                      value={newBadgeColor2}
                      onChange={(e) => setNewBadgeColor2(e.target.value)}
                      title="Второй цвет переливания"
                    />
                    <label className="color-picker-btn" htmlFor="badge-color-2">
                      <span className="color-swatch" style={{ backgroundColor: newBadgeColor2 }} />
                      Цвет 2
                    </label>
                  </div>
                  <label className="badge-shimmer-check">
                    <input type="checkbox" checked={newBadgeShimmer} onChange={(e) => setNewBadgeShimmer(e.target.checked)} />
                    Переливающийся
                  </label>
                  <button type="button" className="btn-primary badge-add-btn" onClick={addBadge}>
                    Добавить
                  </button>
                </div>
                <div className="badge-list">
                  {badges.map((badge, index) => (
                    <div key={index} className="badge-item-wrap">
                      <span className="badge-item" style={{ 
                        backgroundColor: badge.color,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {badge.text}
                        {badge.shimmer && ' ✨'}
                      </span>
                      <button type="button" className="badge-shimmer-btn" onClick={() => toggleBadgeShimmer(index)} title="Переливающийся">✨</button>
                      <button type="button" className="badge-remove" onClick={() => removeBadge(index)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={!!formData.username_shimmer}
                    onChange={(e) => setFormData({ ...formData, username_shimmer: e.target.checked ? 1 : 0 })}
                  />
                  Переливание ника
                </label>
              </div>
              <div className="form-group">
                <label>Цвет 1 переливания ника</label>
                <div className="color-picker-wrap">
                  <input
                    type="color"
                    id="username-shimmer-1"
                    value={formData.username_shimmer_color1 || '#4a9eff'}
                    onChange={(e) => setFormData({ ...formData, username_shimmer_color1: e.target.value })}
                  />
                  <label className="color-picker-btn color-picker-btn-wide" htmlFor="username-shimmer-1">
                    <span className="color-swatch" style={{ backgroundColor: formData.username_shimmer_color1 || '#4a9eff' }} />
                    Выбрать цвет
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label>Цвет 2 переливания ника</label>
                <div className="color-picker-wrap">
                  <input
                    type="color"
                    id="username-shimmer-2"
                    value={formData.username_shimmer_color2 || '#f97316'}
                    onChange={(e) => setFormData({ ...formData, username_shimmer_color2: e.target.value })}
                  />
                  <label className="color-picker-btn color-picker-btn-wide" htmlFor="username-shimmer-2">
                    <span className="color-swatch" style={{ backgroundColor: formData.username_shimmer_color2 || '#f97316' }} />
                    Выбрать цвет
                  </label>
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={!!formData.username_verified}
                    onChange={(e) => setFormData({ ...formData, username_verified: e.target.checked ? 1 : 0 })}
                  />
                  Галочка возле ника
                </label>
              </div>
            </>
          )}
          
          {(type === 'addBanner' || type === 'editBanner') && (
            <>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Изображение баннера</label>
                <div className="banner-image-row">
                  <input
                    type="text"
                    placeholder="URL или загрузите файл"
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="banner-url-input"
                  />
                  <input
                    ref={bannerFileRef}
                    type="file"
                    accept="image/*"
                    onChange={onBannerFileChange}
                    className="banner-file-input"
                  />
                  <button type="button" className="btn-secondary btn-upload" onClick={() => bannerFileRef.current?.click()}>
                    Загрузить файл
                  </button>
                </div>
                {formData.image_url && formData.image_url.startsWith('data:') && (
                  <div className="banner-preview">
                    <img src={formData.image_url} alt="" />
                  </div>
                )}
                {bannerError && <p className="form-error">{bannerError}</p>}
              </div>
              <div className="form-group">
                <label>Ссылка</label>
                <input
                  type="text"
                  value={formData.url || ''}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Позиция</label>
                <select
                  value={formData.position || 'top'}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                >
                  <option value="top">Верх</option>
                  <option value="sidebar">Боковая панель</option>
                  <option value="bottom">Низ</option>
                </select>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active !== 0}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked ? 1 : 0 })}
                  />
                  Активен
                </label>
              </div>
            </>
          )}
          
          {type === 'editCategory' && (
            <>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={formData.slug || ''}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Иконка (emoji)</label>
                <input
                  type="text"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="💬"
                />
              </div>
            </>
          )}

          {(type === 'editPlugin' || type === 'addPlugin') && (
            <>
              <div className="form-group">
                <label>Название</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  value={formData.slug || (formData.name ? formData.name.toLowerCase().replace(/\s+/g, '-') : '')}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Краткое описание</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Полное описание</label>
                <textarea
                  value={formData.full_description || ''}
                  onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                  rows="4"
                />
              </div>
              <div className="form-group">
                <label>Версия</label>
                <input
                  type="text"
                  value={formData.version || '1.0'}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Цена (0 = бесплатно)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price ?? 0}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>URL файла</label>
                <input
                  type="text"
                  value={formData.file_url || ''}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>URL изображения</label>
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              {type === 'addPlugin' && (
                <div className="form-group">
                  <label>ID автора</label>
                  <input
                    type="number"
                    value={formData.author_id || ''}
                    onChange={(e) => setFormData({ ...formData, author_id: parseInt(e.target.value) })}
                    required
                  />
                </div>
              )}
            </>
          )}

          {(type === 'addGroup' || type === 'editGroup') && (
            <>
              <div className="form-group">
                <label>Название группы</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Цвет группы</label>
                <input
                  type="color"
                  value={formData.color || '#666666'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
                <small>Предпросмотр: <span style={{ 
                  backgroundColor: formData.color || '#666', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: '4px',
                  marginLeft: '10px'
                }}>{formData.name || 'Группа'}</span></small>
              </div>
            </>
          )}
          
          <div className="modal-actions">
            <button type="submit" className="btn-primary">Сохранить</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminModal;
