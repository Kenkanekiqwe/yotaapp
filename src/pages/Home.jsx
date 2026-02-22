import { Link } from 'react-router-dom'
import Banner from '../components/Banner'
import './Home.css'

function Home() {
  return (
    <div className="home">
      <Banner position="top" />
      
      <section className="hero">
        <h1>Добро пожаловать в Yota Plugins</h1>
        <p>Лучшая платформа для плагинов Rust</p>
        <Link to="/plugins" className="cta-button">
          Посмотреть плагины
        </Link>
      </section>

      <section className="features">
        <div className="feature-card">
          <h3>Большой выбор</h3>
          <p>Тысячи плагинов для вашего сервера Rust</p>
        </div>
        <div className="feature-card">
          <h3>Быстро и надёжно</h3>
          <p>Проверенные и оптимизированные плагины</p>
        </div>
        <div className="feature-card">
          <h3>Лёгкая установка</h3>
          <p>Простая интеграция с Oxide/uMod</p>
        </div>
        <div className="feature-card">
          <h3>Активное сообщество</h3>
          <p>Форум и обсуждения</p>
        </div>
        <div className="feature-card">
          <h3>Документация</h3>
          <p>Гайды и инструкции</p>
        </div>
        <div className="feature-card">
          <h3>Безопасность</h3>
          <p>Проверка модераторами</p>
        </div>
      </section>
      
      <Banner position="bottom" />
    </div>
  )
}

export default Home
