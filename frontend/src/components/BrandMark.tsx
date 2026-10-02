export default function BrandMark({ className = 'size-11 rounded-xl' }: { className?: string }) {
  return (
    <span className={`grid shrink-0 place-items-center bg-white p-1 shadow-md ${className}`}>
      <img src="/archon-nell-icon.png" alt="Archon Nell" className="h-full w-full object-contain" />
    </span>
  )
}