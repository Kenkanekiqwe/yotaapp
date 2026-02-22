import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Avatar from '../components/Avatar'
import DisplayName from '../components/DisplayName'
import './Forum.css'
import { API_URL } from '../config';


function Forum() {
  const { category } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [threads, setThreads] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newThread, setNewThread] = useState({ title: '', content: '', category_id: '', tags: '' })

  useEffect(() => {
    loadThreads()
    loadCategories()
  }, [category])

  const currentCategory = categories.find(c => c.slug === category)
  const defaultCategoryId = currentCategory?.id || ''

  const loadThreads = async () => {
    setLoading(true)
    try {
      const data = await api.getThreads(category)
      setThreads(data)
    } catch (error) {
      console.error('Error loading threads:', error)
    }
    setLoading(false)
  }

  const loadCategories = async () => {
    try {
      const data = await api.getCategories()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const openCreateModal = () => {
    if (!user) {
      navigate('/login')
      return
    }
    setNewThread({ title: '', content: '', category_id: defaultCategoryId, tags: '' })
    setShowCreateModal(true)
  }

  const handleCreateThread = async (e) => {
    e.preventDefault()
    if (!user) return
    try {
      const response = await fetch('API_URL/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newThread.title,
          content: newThread.content,
          category_id: parseInt(newThread.category_id, 10),
          author_id: user.id,
          tags: newThread.tags.split(',').map(t => t.trim()).filter(Boolean)
        })
      })
      const data = await response.json()
      if (data.id) {
        setShowCreateModal(false)
        setNewThread({ title: '', content: '', category_id: defaultCategoryId, tags: '' })
        addToast('Тема создана', 'success')
        navigate(`/thread/${data.id}`)
      } else {
        addToast(data.error || 'Ошибка создания', 'error')
      }
    } catch (error) {
      addToast('Ошибка подключения', 'error')
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return 'недавно'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    
    if (diff < 60) return 'только что'
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
    return `${Math.floor(diff / 86400)} дн назад`
  }

  return (
    <div className="forum">
      <div className="forum-header">
        <h1>{currentCategory ? currentCategory.name : 'Форум'}</h1>
        <button className="btn-primary" onClick={openCreateModal}>
          Создать тему
        </button>
      </div>

      <div className="forum-filters">
        <button className="filter-btn active">Все темы</button>
        <button className="filter-btn">Популярные</button>
        <button className="filter-btn">Новые</button>
        <button className="filter-btn">Без ответов</button>
      </div>

      {loading ? (
        <div className="loading">Загрузка...</div>
      ) : (
        <div className="threads-list">
          {threads.map(thread => (
            <Link to={`/thread/${thread.id}`} key={thread.id} className="thread-item">
              <div className="thread-avatar">
                <Avatar src={thread.author_avatar} fallback={thread.author_name} size="md" />
              </div>
              <div className="thread-content">
                <div className="thread-title-row">
                  {thread.pinned === 1 && <span className="badge badge-pinned">Закреплено</span>}
                  {thread.locked === 1 && <span className="badge badge-locked">Закрыто</span>}
                  {typeof thread.tags === 'string' && thread.tags.split(',').filter(Boolean).slice(0, 3).map((tag, idx) => (
                    <span className="badge badge-tag" key={`${thread.id}-tag-${idx}`}>{tag}</span>
                  ))}
                  <h3 className="thread-title">{thread.title}</h3>
                </div>
                <div className="thread-meta">
                  <span className="thread-author">
                    <DisplayName
                      name={thread.author_name}
                      shimmer={thread.author_name_shimmer}
                      shimmerColor1={thread.author_name_shimmer_color1}
                      shimmerColor2={thread.author_name_shimmer_color2}
                      verified={thread.author_name_verified}
                    />
                  </span>
                  <span className="thread-separator">•</span>
                  <span className="thread-time">{formatTime(thread.last_post_time || thread.created_at)}</span>
                </div>
              </div>
              <div className="thread-stats">
                <div className="stat">
                  <span className="stat-value">{thread.reply_count || 0}</span>
                  <span className="stat-label">ответов</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{thread.views}</span>
                  <span className="stat-label">просмотров</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Создать новую тему</h2>
            <form onSubmit={handleCreateThread}>
              <div className="form-group">
                <label>Категория</label>
                <select
                  value={newThread.category_id}
                  onChange={(e) => setNewThread({ ...newThread, category_id: e.target.value })}
                  required
                >
                  <option value="">Выберите категорию</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Название темы</label>
                <input
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                  placeholder="Введите название темы"
                  required
                />
              </div>
              <div className="form-group">
                <label>Сообщение</label>
                <textarea
                  value={newThread.content}
                  onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                  placeholder="Напишите ваше сообщение..."
                  rows="8"
                  required
                />
              </div>
              <div className="form-group">
                <label>Теги (через запятую)</label>
                <input
                  type="text"
                  value={newThread.tags}
                  onChange={(e) => setNewThread({ ...newThread, tags: e.target.value })}
                  placeholder="гайд, вопрос, релиз"
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Создать</button>
                <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Forum
