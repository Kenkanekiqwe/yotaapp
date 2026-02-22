import './DisplayName.css'

function DisplayName({
  name,
  shimmer = 0,
  shimmerColor1 = '#4a9eff',
  shimmerColor2 = '#f97316',
  verified = 0,
  className = ''
}) {
  return (
    <span className={`display-name ${shimmer ? 'display-name-shimmer' : ''} ${className}`} style={{
      ...(shimmer ? { '--name-color1': shimmerColor1 || '#4a9eff', '--name-color2': shimmerColor2 || '#f97316' } : {})
    }}>
      {name}
      {verified ? <span className="display-name-check" title="Подтвержденный пользователь">✔</span> : null}
    </span>
  )
}

export default DisplayName
