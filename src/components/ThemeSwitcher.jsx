import { useState, useEffect, useRef } from 'react'

const themes = [
  { id: 'dark', name: 'Тёмная' },
  { id: 'light', name: 'Светлая' },
  { id: 'blue', name: 'Синяя' },
  { id: 'green', name: 'Зелёная' },
  { id: 'purple', name: 'Фиолетовая' },
  { id: 'red', name: 'Красная' },
  { id: 'orange', name: 'Оранжевая' },
  { id: 'gray', name: 'Серая' },
  { id: 'amoled', name: 'AMOLED' },
  { id: 'cyberpunk', name: 'Cyberpunk' }
]

function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    if (saved) setActiveTheme(saved)
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const applyTheme = (id) => {
    document.documentElement.removeAttribute('data-theme')
    if (id !== 'dark') document.documentElement.setAttribute('data-theme', id)
    localStorage.setItem('theme', id)
    setActiveTheme(id)
    setOpen(false)
  }

  return (
    <div className="theme-switcher" ref={ref}>
      <button type="button" className="theme-btn" onClick={() => setOpen(!open)} title="Тема оформления">
        <span className="theme-icon">◐</span>
        <span className="theme-label">{themes.find(t => t.id === activeTheme)?.name || 'Тема'}</span>
      </button>
      {open && (
        <div className="theme-dropdown">
          {themes.map(t => (
            <button key={t.id} type="button" className={`theme-option ${activeTheme === t.id ? 'active' : ''}`} onClick={() => applyTheme(t.id)}>
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThemeSwitcher
