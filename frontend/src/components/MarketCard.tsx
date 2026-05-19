export function MarketCard({ market }: { market: any }) {
  return <div className="card">{market.question} <span className="badge">{market.status}</span></div>;
}
