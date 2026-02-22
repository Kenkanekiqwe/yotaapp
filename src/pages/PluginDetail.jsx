import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../api/api'
import './PluginDetail.css'

function PluginDetail() {
  const { slug } = useParams()
  const [plugin, setPlugin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getPlugin(slug)
        setPlugin(data)
      } catch (e) {
        setPlugin(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  const handleDownload = () => {
    if (plugin?.file_url) {
      window.open(plugin.file_url, '_blank')
    }
  }

  if (loading) return <div className="plugin-detail"><div className="loading">Загрузка...</div></div>
  if (!plugin) return <div className="plugin-detail"><p>Плагин не найден.</p><Link to="/plugins">← К списку плагинов</Link></div>

  return (
    <div className="plugin-detail">
      <Link to="/plugins" className="back-link">← Назад к списку плагинов</Link>

      <div className="plugin-header">
        <div className="plugin-header-main">
          <div className="plugin-image-wrap">
            {plugin.image_url && (plugin.image_url.startsWith('http') || plugin.image_url.startsWith('data:')) && (
              <img src={plugin.image_url} alt="" className="plugin-image" onError={e => { e.target.onerror = null; e.target.style.display = 'none' }} />
            )}
            <div className="plugin-image-placeholder" />
          </div>
          <div>
            <h1>{plugin.name}</h1>
            <div className="plugin-meta">
              <span>Версия: {plugin.version || '1.0'}</span>
              <span>Автор: <Link to={`/profile/${plugin.author_name}`}>{plugin.author_name}</Link></span>
              <span className="downloads-count">{plugin.downloads?.toLocaleString() ?? 0} загрузок</span>
              {plugin.price > 0 && <span className="price">{plugin.price} ₽</span>}
            </div>
            <p className="plugin-short-desc">{plugin.description}</p>
            <button className="btn-download" onClick={handleDownload} disabled={!plugin.file_url}>
              Скачать плагин
            </button>
          </div>
        </div>
      </div>

      <div className="plugin-content">
        {plugin.full_description && (
          <section className="section">
            <h2>Описание</h2>
            <p className="plugin-full-desc">{plugin.full_description}</p>
          </section>
        )}
      </div>
    </div>
  )
}

export default PluginDetail
