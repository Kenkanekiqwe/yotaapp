import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/api'
import Banner from '../components/Banner'
import './Sidebar.css'

function Sidebar() {
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState({})

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [categoriesData, statsData] = await Promise.all([
        api.getCategories(),
        api.getStats()
      ])
      setCategories(categoriesData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading sidebar data:', error)
    }
  }

  return (
    <aside className="sidebar">
      <Banner position="sidebar" />
      
      <div className="sidebar-section">
        <h3>Категории</h3>
        <ul className="category-list">
          {categories.map(cat => (
            <li key={cat.id}>
              <Link to={`/forum/${cat.slug}`} className="category-item">
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
                <span className="category-count">{cat.thread_count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="sidebar-section">
        <h3>Статистика</h3>
        <div className="stats">
          <div className="stat-item">
            <span className="stat-label">Темы</span>
            <span className="stat-value">{stats.threads?.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Сообщения</span>
            <span className="stat-value">{stats.posts?.toLocaleString()}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Участники</span>
            <span className="stat-value">{stats.users?.toLocaleString()}</span>
          </div>
          <div className="stat-item online">
            <span className="stat-label">Онлайн</span>
            <span className="stat-value">{stats.online}</span>
          </div>
        </div>
      </div>

      <div className="sidebar-section">
        <h3>Популярные теги</h3>
        <div className="tags">
          <span className="tag">oxide</span>
          <span className="tag">umod</span>
          <span className="tag">admin</span>
          <span className="tag">economy</span>
          <span className="tag">pvp</span>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
