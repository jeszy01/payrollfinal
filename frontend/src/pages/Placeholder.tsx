export default function Placeholder({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="empty-state">
      <h2>{title}</h2>
      <p>{subtitle}. Gagawin sa susunod na step.</p>
    </div>
  )
}
