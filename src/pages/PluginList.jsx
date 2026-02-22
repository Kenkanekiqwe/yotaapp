import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { api } from '../api/api'
import './PluginList.css'

function PluginList() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [plugins, setPlugins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    full_description: '',
    version: '1.0',
    price: 0,
    file_url: '',
    image_url: ''
  })

  useEffect(() => {
    loadPlugins()
  }, [search])

  const loadPlugins = async () => {
    setLoading(true)
    try {
      const data = await api.getPlugins(search)
      setPlugins(data)
    } catch (error) {
      console.error('Error loading plugins:', error)
    }
    setLoading(false)
  }

  const openForm = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setFormData({
      name: '',
      slug: '',
      description: '',
      full_description: '',
      version: '1.0',
      price: 0,
      file_url: '',
      image_url: ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return
    try {
      const res = await fetch('http://localhost:3001/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userId: user.id
        })
      })
      const data = await res.json()
      if (data.slug) {
        setShowForm(false)
        loadPlugins()
        addToast('Плагин успешно опубликован', 'success')
        navigate(`/plugin/${data.slug}`)
      } else {
        addToast(data.error || 'Ошибка публикации', 'error')
      }
    } catch (err) {
      addToast('Ошибка подключения', 'error')
    }
  }

  const updateSlug = (name) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }))
  }

  return (
    <div className="plugin-list">
      <div className="plugin-list-header">
        <h1>Плагины для Rust</h1>
        {user ? (
          <button type="button" className="btn-primary btn-add-plugin" onClick={openForm}>
            Добавить плагин
          </button>
        ) : (
          <Link to="/login" className="btn-primary btn-add-plugin">Войти, чтобы добавить плагин</Link>
        )}
      </div>
      <div className="search-bar">
        <input
          type="text"
          placeholder="Поиск плагинов..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="plugins-grid">
          {plugins.map(plugin => (
            <Link to={`/plugin/${plugin.slug}`} key={plugin.id} className="plugin-card" title={plugin.name}>
              <div className="plugin-card-image">
                {plugin.image_url && (plugin.image_url.startsWith('http') || plugin.image_url.startsWith('data:')) && (
                  <img src={plugin.image_url} alt="" onError={e => { e.target.onerror = null; e.target.style.display = 'none' }} />
                )}
                <div className="plugin-card-placeholder" />
              </div>
              <h3>{plugin.name}</h3>
              <p className="author">Автор: {plugin.author_name}</p>
              <p className="description">{plugin.description}</p>
              <div className="plugin-meta">
                <span className="downloads">{(plugin.downloads ?? 0).toLocaleString()} загрузок</span>
                {plugin.avg_rating && (
                  <span className="rating">{plugin.avg_rating.toFixed(1)}</span>
                )}
                {plugin.price > 0 ? (
                  <span className="price">{plugin.price} ₽</span>
                ) : (
                  <span className="price-free">Бесплатно</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal plugin-form-modal" onClick={e => e.stopPropagation()}>
            <h2>Опубликовать плагин</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateSlug(e.target.value)}
                  placeholder="Название плагина"
                  required
                />
              </div>
              <div className="form-group">
                <label>Slug (адрес в URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="my-plugin"
                />
              </div>
              <div className="form-group">
                <label>Краткое описание *</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Одна строка — что делает плагин"
                  required
                />
              </div>
              <div className="form-group">
                <label>Полное описание</label>
                <textarea
                  value={formData.full_description}
                  onChange={e => setFormData({ ...formData, full_description: e.target.value })}
                  rows="4"
                  placeholder="Подробное описание, инструкция..."
                />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Версия</label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={e => setFormData({ ...formData, version: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Цена (0 = бесплатно)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Ссылка на файл</label>
                <input
                  type="url"
                  value={formData.file_url}
                  onChange={e => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="form-group">
                <label>Ссылка на изображение</label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Опубликовать</button>
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PluginList
