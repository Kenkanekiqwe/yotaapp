import './UserBadge.css';

function UserBadge({ badges }) {
  if (!badges) return null;
  
  let badgeArray = [];
  try {
    badgeArray = typeof badges === 'string' ? JSON.parse(badges) : badges;
  } catch (e) {
    return null;
  }
  
  if (!Array.isArray(badgeArray) || badgeArray.length === 0) return null;

  return (
    <div className="user-badges-container">
      {badgeArray.map((badge, index) => (
        <span
          key={index}
          className={`user-badge ${badge.shimmer ? 'user-badge-shimmer' : ''}`}
          style={{
            backgroundColor: badge.color || '#666',
            color: badge.textColor || '#fff',
            ...(badge.shimmer && {
              '--badge-color1': badge.color || '#666',
              '--badge-color2': badge.shimmerColor2 || '#ffffff'
            })
          }}
        >
          {badge.text}
        </span>
      ))}
    </div>
  );
}

export default UserBadge;
