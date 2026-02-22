import { Link } from 'react-router-dom'
import './Categories.css'

const categories = [
  {
    id: 'general',
    name: 'Общее',
    icon: '💬',
    description: 'Общие обсуждения о Rust и серверах',
    threads: 245,
    posts: 3421,
    lastPost: { title: 'Обсуждение обновления', author: 'Admin', time: '5 мин назад' }
  },
  {
    id: 'plugins',
    name: 'Плагины',
    icon: '🔌',
    description: 'Обсуждение плагинов, релизы и обновления',
    threads: 1523,
    posts: 12456,
    lastPost: { title: 'Новый плагин EconomySystem', author: 'Developer1', time: '1 час назад' }
  },
  {
    id: 'help',
    name: 'Помощь',
    icon: '❓',
    description: 'Вопросы и ответы по установке и настройке',
    threads: 89,
    posts: 567,
    lastPost: { title: 'Как установить AdminTools?', author: 'User123', time: '2 часа назад' }
  },
  {
    id: 'development',
    name: 'Разработка',
    icon: '💻',
    description: 'Разработка плагинов и обмен опытом',
    threads: 342,
    posts: 2890,
    lastPost: { title: 'API документация', author: 'Developer2', time: '3 часа назад' }
  },
]

function Categories() {
  return (
    <div className="categories">
      <h1>Категории форума</h1>
      
      <div className="categories-list">
        {categories.map(category => (
          <Link to={`/forum/${category.id}`} key={category.id} className="category-card">
            <div className="category-icon-large">{category.icon}</div>
            <div className="category-content">
              <h2>{category.name}</h2>
              <p className="category-description">{category.description}</p>
              <div className="category-stats">
                <span>📝 {category.threads} тем</span>
                <span>💬 {category.posts} сообщений</span>
              </div>
              <div className="category-last-post">
                <span className="last-post-label">Последнее сообщение:</span>
                <span className="last-post-title">{category.lastPost.title}</span>
                <span className="last-post-meta">
                  от {category.lastPost.author} • {category.lastPost.time}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Categories
