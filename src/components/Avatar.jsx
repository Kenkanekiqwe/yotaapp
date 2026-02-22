import { useState } from 'react'

function Avatar({ src, fallback, size = 'md', className = '' }) {
  const [failed, setFailed] = useState(false)
  const showImg = src && (src.startsWith('http') || src.startsWith('data:')) && !failed
  const letter = fallback ? String(fallback).charAt(0).toUpperCase() : '?'

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {showImg ? (
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{letter}</span>
      )}
    </div>
  )
}

export default Avatar
