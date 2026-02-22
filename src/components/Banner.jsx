import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import './Banner.css';

function Banner({ position = 'top' }) {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    loadBanners();
  }, [position]);

  useEffect(() => {
    const onFocus = () => loadBanners();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [position]);

  const loadBanners = async () => {
    try {
      const res = await fetch(`${API_URL}/banners?position=${position}`);
      const data = await res.json();
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className={`banner-container banner-${position}`}>
      {banners.map(banner => {
        const Wrapper = banner.url ? 'a' : 'div';
        return (
          <Wrapper
            key={banner.id}
            {...(banner.url ? { href: banner.url, target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="banner"
          >
            <img
              src={banner.image_url}
              alt={banner.title}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                const placeholder = e.target.nextElementSibling;
                if (placeholder?.classList.contains('banner-placeholder')) placeholder.style.display = 'block';
              }}
            />
            <span className="banner-placeholder" style={{ display: 'none' }}>Баннер</span>
          </Wrapper>
        );
      })}
    </div>
  );
}

export default Banner;
