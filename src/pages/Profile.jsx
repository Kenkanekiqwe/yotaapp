import { useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import UserBadge from '../components/UserBadge'
import Avatar from '../components/Avatar'
import './Profile.css'
import { API_URL } from '../config';


function Profile() {
  const { username } = useParams()
  const { user } = useAuth()
  const [profileUser, setProfileUser] = useState(null)
  const [profileSettings, setProfileSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('info')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ bio: '', location: '', website: '', avatar: '', signature: '', banner_url: '' })
  const [settingsForm, setSettingsForm] = useState({ show_stats: true, show_activity: true, show_online: true })
  const { addToast } = useToast()

  const isOwnProfile = user && profileUser && user.username === profileUser.username

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/users/${username}`)
        const data = await res.json()
        setProfileUser(data)
        setFormData({
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          avatar: data.avatar || '',
          signature: data.signature || '',
          banner_url: data.banner_url || ''
        })
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [username])

  useEffect(() => {
    if (isOwnProfile && profileUser) {
      fetch(`${API_URL}/users/${username}/settings`)
        .then(r => r.json())
        .then(data => {
          setProfileSettings(data)
          setSettingsForm({
            show_stats: data.show_stats !== 0,
            show_activity: data.show_activity !== 0,
            show_online: data.show_online !== 0
          })
        })
        .catch(() => setProfileSettings({}))
    }
  }, [isOwnProfile, username, profileUser])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${API_URL}/users/${username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...formData })
      })
      setProfileUser(prev => ({ ...prev, ...formData }))
      setEditing(false)
      addToast('Профиль сохранён', 'success')
    } catch (e) {
      addToast('Ошибка сохранения', 'error')
    }
  }

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    try {
      await fetch(`${API_URL}/users/${username}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, ...settingsForm })
      })
      setProfileSettings(settingsForm)
      addToast('Настройки сохранены', 'success')
    } catch (e) {
      addToast('Ошибка сохранения', 'error')
    }
  }

  const formatDate = (d) => new Date(d).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  const showStats = !profileSettings || profileSettings.show_stats !== 0
  const showActivity = !profileSettings || profileSettings.show_activity !== 0

  if (loading) return <div className="profile-loading">Загрузка...</div>
  if (!profileUser) return <div className="profile-notfound">Пользователь не найден</div>

  const bannerSrc = formData.banner_url || profileUser.banner_url

  return (
    <div className="profile">
      <div className="profile-cover">
        {bannerSrc && (
          <img src={bannerSrc} alt="" onError={e => { e.target.onerror = null; e.target.style.display = 'none' }} />
        )}
        <div className="profile-cover-placeholder" />
      </div>
      <div className="profile-card">
        <div className="profile-avatar-wrap">
          <Avatar
            src={formData.avatar || profileUser.avatar}
            fallback={profileUser.username}
            size="xl"
            className="profile-avatar"
          />
          <h1>{profileUser.username}</h1>
          {profileUser.title && <div className="profile-title">{profileUser.title}</div>}
          <UserBadge badges={profileUser.badges} />
        </div>

        {isOwnProfile && (
          <div className="profile-tabs">
            <button className={tab === 'info' ? 'active' : ''} onClick={() => setTab('info')}>Информация</button>
            {showStats && <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>Статистика</button>}
            <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Настройки</button>
          </div>
        )}

        <div className="profile-body">
          {isOwnProfile && tab === 'info' && (
            <>
              {editing ? (
                <form className="profile-form" onSubmit={handleSaveProfile}>
                  <div className="form-row">
                    <label>О себе</label>
                    <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} rows="3" placeholder="Расскажите о себе" />
                  </div>
                  <div className="form-row">
                    <label>Местоположение</label>
                    <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Город, страна" />
                  </div>
                  <div className="form-row">
                    <label>Сайт</label>
                    <input type="url" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="https://" />
                  </div>
                  <div className="form-row">
                    <label>Аватар (URL или загрузка)</label>
                    <input type="text" value={formData.avatar} onChange={e => setFormData({ ...formData, avatar: e.target.value })} placeholder="https://..." />
                    <input type="file" accept="image/*" className="form-file"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f && f.size <= 10 * 1024 * 1024) {
                          const r = new FileReader()
                          r.onload = () => setFormData(p => ({ ...p, avatar: r.result }))
                          r.readAsDataURL(f)
                        } else if (f) addToast('Макс. 10 МБ', 'warning')
                      }}
                    />
                  </div>
                  <div className="form-row">
                    <label>Баннер профиля</label>
                    <div className="profile-banner-row">
                      <input
                        type="text"
                        value={formData.banner_url}
                        onChange={e => setFormData({ ...formData, banner_url: e.target.value })}
                        placeholder="URL или нажмите «Загрузить файл»"
                        className="profile-banner-url"
                      />
                      <input
                        type="file"
                        accept="image/*"
                        id="profile-banner-file"
                        className="form-file-hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f && f.size <= 1500 * 1024) {
                            const r = new FileReader()
                            r.onload = () => setFormData(p => ({ ...p, banner_url: r.result }))
                            r.readAsDataURL(f)
                          } else if (f) addToast('Макс. 1.5 МБ', 'warning')
                          e.target.value = ''
                        }}
                      />
                      <button type="button" className="btn-secondary btn-upload" onClick={() => document.getElementById('profile-banner-file')?.click()}>
                        Загрузить файл
                      </button>
                    </div>
                    {formData.banner_url && formData.banner_url.startsWith('data:') && (
                      <div className="profile-banner-preview">
                        <img src={formData.banner_url} alt="" />
                      </div>
                    )}
                  </div>
                  <div className="form-row">
                    <label>Подпись</label>
                    <textarea value={formData.signature} onChange={e => setFormData({ ...formData, signature: e.target.value })} rows="2" placeholder="Под сообщениями на форуме" />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">Сохранить</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditing(false)}>Отмена</button>
                  </div>
                </form>
              ) : (
                <div className="profile-info">
                  <p className="profile-bio">{profileUser.bio || '—'}</p>
                  <div className="profile-meta">
                    <span>Регистрация: {formatDate(profileUser.created_at)}</span>
                    {profileUser.location && <span>{profileUser.location}</span>}
                    {profileUser.website && (
                      <a href={profileUser.website} target="_blank" rel="noopener noreferrer">Сайт</a>
                    )}
                  </div>
                  {isOwnProfile && (
                    <button className="btn-secondary btn-sm" onClick={() => setEditing(true)}>Редактировать профиль</button>
                  )}
                </div>
              )}
            </>
          )}

          {isOwnProfile && tab === 'stats' && (
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-num">{profileUser.post_count || 0}</span>
                <span className="stat-lbl">Сообщений</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{profileUser.reputation || 0}</span>
                <span className="stat-lbl">Репутация</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{profileUser.thread_count || 0}</span>
                <span className="stat-lbl">Тем</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">{profileUser.plugin_count || 0}</span>
                <span className="stat-lbl">Плагинов</span>
              </div>
            </div>
          )}

          {isOwnProfile && tab === 'settings' && (
            <form className="profile-settings-form" onSubmit={handleSaveSettings}>
              <label className="check-row">
                <input type="checkbox" checked={settingsForm.show_stats} onChange={e => setSettingsForm({ ...settingsForm, show_stats: e.target.checked })} />
                Показывать статистику
              </label>
              <label className="check-row">
                <input type="checkbox" checked={settingsForm.show_activity} onChange={e => setSettingsForm({ ...settingsForm, show_activity: e.target.checked })} />
                Показывать активность
              </label>
              <label className="check-row">
                <input type="checkbox" checked={settingsForm.show_online} onChange={e => setSettingsForm({ ...settingsForm, show_online: e.target.checked })} />
                Показывать статус онлайн
              </label>
              <button type="submit" className="btn-primary">Сохранить настройки</button>
            </form>
          )}

          {!isOwnProfile && (
            <div className="profile-info">
              <p className="profile-bio">{profileUser.bio || '—'}</p>
              <div className="profile-meta">
                <span>Регистрация: {formatDate(profileUser.created_at)}</span>
                {profileUser.location && <span>{profileUser.location}</span>}
                {profileUser.website && (
                  <a href={profileUser.website} target="_blank" rel="noopener noreferrer">Сайт</a>
                )}
              </div>
              {showStats && (
                <div className="profile-stats profile-stats-inline">
                  <span>{profileUser.post_count || 0} сообщ.</span>
                  <span>{profileUser.thread_count || 0} тем</span>
                  <span>{profileUser.plugin_count || 0} плагинов</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
