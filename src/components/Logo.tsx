export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7c5cff" />
          <stop offset="1" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="#141824" />
      <circle cx="12" cy="12" r="4.5" fill="url(#lg)" />
      <circle cx="21" cy="21" r="5.5" fill="url(#lg)" opacity="0.7" />
      <circle cx="22" cy="10" r="3" fill="url(#lg)" opacity="0.5" />
    </svg>
  )
}