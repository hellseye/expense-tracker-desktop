export default function StatCard({ label, value, subtitle, tone }) {
  return (
    <div className={`card stat ${tone}`}>
      <p className="stat-label">{label}</p>
      <h2 className="stat-value">{value}</h2>
      <p className="muted">{subtitle}</p>
    </div>
  );
}
