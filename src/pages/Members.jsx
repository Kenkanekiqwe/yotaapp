import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/api'
import Avatar from '../components/Avatar'
import './Members.css'

function Members() {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('reputation')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMembers = async () => {
      try {
        const data = await api.getUsers()
        setMembers(Array.isArray(data) ? data : [])
      } catch (e) {
        console.error('Error loading members:', e)
        setMembers([])
      } finally {
        setLoading(false)
      }
    }
    loadMembers()
  }, [])

  const formatJoined = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })
  }

  const filteredMembers = members
    .filter(member =>
      member.username.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sort === 'posts') {
        return (b.post_count || 0) - (a.post_count || 0)
      }
      if (sort === 'joined') {
        return new Date(b.created_at) - new Date(a.created_at)
      }
      // reputation (default)
      return (b.reputation || 0) - (a.reputation || 0)
    })

  return (
    <div className="members">
      <h1>Участники</h1>
      
      <div className="members-controls">
        <input
          type="text"
          placeholder="Поиск участников..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="reputation">По репутации</option>
          <option value="posts">По сообщениям</option>
          <option value="joined">По дате регистрации</option>
        </select>
      </div>

      {loading && <div>Загрузка...</div>}

      <div className="members-grid">
        {filteredMembers.map(member => (
          <Link to={`/profile/${member.username}`} key={member.username} className="member-card">
            <div className="member-header">
              <Avatar src={member.avatar} fallback={member.username} size="lg" className="member-avatar" />
              {member.is_online ? <span className="online-badge">●</span> : null}
            </div>
            <h3 className="member-username">{member.username}</h3>
            <div className="member-stats">
              <div className="member-stat">
                <span className="stat-label">Сообщений</span>
                <span className="stat-value">{member.post_count || 0}</span>
              </div>
              <div className="member-stat">
                <span className="stat-label">Репутация</span>
                <span className="stat-value">{member.reputation}</span>
              </div>
            </div>
            <div className="member-joined">Регистрация: {formatJoined(member.created_at)}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Members
