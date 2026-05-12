export function StatBar({ label, value, tone }) {
  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span>{label}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <div className="stat-card__track">
        <div
          className={`stat-card__fill stat-card__fill--${tone}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
