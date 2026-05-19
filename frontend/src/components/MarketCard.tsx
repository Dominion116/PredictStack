export function MarketCard({ market }) {
  return <div className="card">{market.question} <span className="badge">{market.status}</span></div>;
}
