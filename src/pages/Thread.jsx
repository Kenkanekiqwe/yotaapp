import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import UserBadge from '../components/UserBadge'
import Avatar from '../components/Avatar'
import DisplayName from '../components/DisplayName'
import './Thread.css'
import { API_URL } from '../config';


function Thread() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToast } = useToast()
  const [thread, setThread] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(true)
  const [reactions, setReactions] = useState({})
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportPost, setReportPost] = useState(null)

  useEffect(() => {
    loadThread()
  }, [id])

  const loadThread = async () => {
    setLoading(true)
    try {
      const anonViewerId = localStorage.getItem('anonViewerId') || `anon-${Math.random().toString(36).slice(2, 12)}`
      if (!localStorage.getItem('anonViewerId')) localStorage.setItem('anonViewerId', anonViewerId)
      const viewerKey = user ? `user:${user.id}` : anonViewerId
      const data = await api.getThread(id, viewerKey)
      setThread(data)
      if (data.posts && data.posts.length > 0) {
        const ids = data.posts.map(p => p.id).join(',')
        const res = await fetch(`${API_URL}/posts/reactions?ids=${ids}`)
        const rdata = await res.json()
        setReactions(rdata || {})
      } else {
        setReactions({})
      }
    } catch (error) {
      console.error('Error loading thread:', error)
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!replyText.trim() || !user) return
    if (thread?.locked === 1) {
      addToast('Тема закрыта для ответов', 'warning')
      return
    }
    
    try {
      await api.createPost(id, replyText, user.id)
      setReplyText('')
      addToast('Ответ добавлен', 'success')
      loadThread()
    } catch (error) {
      addToast('Ошибка отправки', 'error')
    }
  }

  const handleReact = async (postId, reaction) => {
    if (!user) return
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, reaction })
      })
      const data = await res.json()
      if (data && data.reactions) {
        setReactions(prev => ({ ...prev, [postId]: data.reactions }))
      }
    } catch (error) {
      console.error('Error reacting to post:', error)
    }
  }

  const handleGiveRep = async (post) => {
    if (!user) return
    if (post.rep_given || post.author_id === user.id) return
    try {
      const res = await fetch(`${API_URL}/posts/${post.id}/rep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })
      const data = await res.json()
      if (data.success) {
        setThread(prev => ({
          ...prev,
          posts: prev.posts.map(p =>
            p.id === post.id
              ? { ...p, rep_given: true, reputation: data.reputation }
              : p
          )
        }))
        addToast('Репутация автора увеличена', 'success')
      } else {
        addToast(data.error || 'Не удалось выдать REP', 'error')
      }
    } catch (e) {
      addToast('Ошибка', 'error')
    }
  }

  const handleReport = async (post) => {
    if (!user) return
    setReportPost(post)
    setReportReason('')
    setReportModalOpen(true)
  }

  const submitReport = async (e) => {
    e.preventDefault()
    if (!reportPost || !reportReason.trim()) return
    try {
      await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'post',
          content_id: reportPost.id,
          reported_id: reportPost.author_id,
          content_summary: reportReason.trim(),
          userId: user.id
        })
      })
      setReportModalOpen(false)
      addToast('Жалоба отправлена. Модераторы рассмотрят её.', 'success')
    } catch (error) {
      console.error('Error reporting:', error)
      addToast('Ошибка при отправке жалобы', 'error')
    }
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    
    if (diff < 60) return 'только что'
    if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`
    return `${Math.floor(diff / 86400)} дн назад`
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' })
  }

  if (loading) return <div className="loading">Загрузка...</div>
  if (!thread) return <div>Тема не найдена</div>

  return (
    <div className="thread">
      <div className="breadcrumb">
        <Link to="/forum">Форум</Link>
        <span> / </span>
        <Link to={`/forum/${thread.category_slug}`}>{thread.category_name}</Link>
        <span> / </span>
        <span>{thread.title}</span>
      </div>

      <div className="thread-header">
        <h1>{thread.title}</h1>
        {Array.isArray(thread.tags) && thread.tags.length > 0 && (
          <div className="thread-tags">
            {thread.tags.map((tag) => (
              <span key={tag} className="thread-tag">{tag}</span>
            ))}
          </div>
        )}
        <div className="thread-info">
          <span>{thread.views} просмотров</span>
          <span>{thread.posts?.length || 0} ответов</span>
        </div>
      </div>

      <div className="posts-list">
        {thread.posts?.map(post => (
          <div key={post.id} className="post">
            <div className="post-sidebar">
              <div className="post-avatar">
                <Avatar src={post.avatar} fallback={post.username} size="lg" />
              </div>
              <div className="post-author-info">
                <Link to={`/profile/${post.username}`} className="post-author">
                  <DisplayName
                    name={post.username}
                    shimmer={post.username_shimmer}
                    shimmerColor1={post.username_shimmer_color1}
                    shimmerColor2={post.username_shimmer_color2}
                    verified={post.username_verified}
                  />
                </Link>
                <UserBadge badges={post.badges} />
              </div>
              <div className="user-stats">
                <div className="user-stat">
                  <span className="stat-label">Сообщений:</span>
                  <span className="stat-value">{post.user_post_count}</span>
                </div>
                <div className="user-stat">
                  <span className="stat-label">Репутация:</span>
                  <span className="stat-value">{post.reputation}</span>
                </div>
                <div className="user-stat">
                  <span className="stat-label">Регистрация:</span>
                  <span className="stat-value">{formatDate(post.user_joined)}</span>
                </div>
              </div>
            </div>
            <div className="post-content">
              <div className="post-header">
                <span className="post-time">{formatTime(post.created_at)}</span>
              </div>
              <div className="post-body">
                <p>{post.content}</p>
                {post.signature && (
                  <div className="post-signature">
                    <hr />
                    <div>{post.signature}</div>
                  </div>
                )}
              </div>
              <div className="post-actions">
                <div className="reactions-bar">
                  {['👍', '❤️', '😂', '😮', '😡'].map(r => (
                    <button
                      key={r}
                      className="action-btn reaction-btn"
                      onClick={() => handleReact(post.id, r)}
                    >
                      {r} {reactions[post.id]?.[r] || 0}
                    </button>
                  ))}
                  {user && user.id !== post.author_id && (
                    <button
                      type="button"
                      className={`action-btn rep-btn ${post.rep_given ? 'rep-given' : ''}`}
                      onClick={() => handleGiveRep(post)}
                      disabled={!!post.rep_given}
                      title={post.rep_given ? 'Вы уже дали REP' : 'Дать репутацию автору'}
                    >
                      {post.rep_given ? '✓ REP' : '+REP'}
                    </button>
                  )}
                </div>
                <button className="action-btn" onClick={() => handleReport(post)}>Пожаловаться</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {user && thread.locked !== 1 ? (
        <form onSubmit={handleSubmit} className="reply-box">
          <h3>Ответить</h3>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Напишите ваш ответ..."
            rows="6"
          />
          <div className="reply-actions">
            <button type="submit" className="btn-primary">Отправить</button>
          </div>
        </form>
      ) : user && thread.locked === 1 ? (
        <div className="login-prompt">
          <p>Тема закрыта. Новые ответы отключены.</p>
        </div>
      ) : (
        <div className="login-prompt">
          <p>Чтобы оставить комментарий, <Link to="/login">войдите</Link> или <Link to="/register">зарегистрируйтесь</Link></p>
        </div>
      )}

      {reportModalOpen && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Жалоба на сообщение</h2>
            <form onSubmit={submitReport}>
              <div className="form-group">
                <label>Причина жалобы</label>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  rows="4"
                  placeholder="Опишите, что нарушено"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary">Отправить</button>
                <button type="button" className="btn-secondary" onClick={() => setReportModalOpen(false)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Thread
