import type { LucideIcon } from "lucide-react"

const CIRC = 2 * Math.PI * 35

const CIRCLE_COLORS = {
  blue:    { ring: "text-blue-500",    track: "text-blue-500/20",    pct: "text-blue-500",    innerCls: "bg-blue-500/10 group-hover:bg-blue-500/20"       },
  violet:  { ring: "text-violet-500",  track: "text-violet-500/20",  pct: "text-violet-500",  innerCls: "bg-violet-500/10 group-hover:bg-violet-500/20"   },
  emerald: { ring: "text-emerald-500", track: "text-emerald-500/20", pct: "text-emerald-500", innerCls: "bg-emerald-500/10 group-hover:bg-emerald-500/20" },
}

interface CircleBtnProps {
  Icon: LucideIcon
  label: string
  progress: number
  onClick: () => void
  color: "blue" | "violet" | "emerald"
}

export function CircleBtn({ Icon, label, progress, onClick, color }: CircleBtnProps) {
  const c = CIRCLE_COLORS[color]
  const p = Math.min(Math.max(progress, 0), 1)
  const filled = CIRC * p
  const gap    = CIRC - filled
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={onClick}
        className="group relative size-[84px] touch-manipulation cursor-pointer
                   transition-transform duration-150 ease-out
                   hover:scale-110 active:scale-[0.91] active:opacity-80"
      >
        <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 84 84">
          <circle cx="42" cy="42" r="35" fill="none" strokeWidth="5.5" stroke="currentColor"
            className={`${c.track} transition-opacity duration-200 group-hover:opacity-60`} />
          {filled > 0.5 && (
            <circle cx="42" cy="42" r="35" fill="none" strokeWidth="5.5" stroke="currentColor"
              strokeLinecap="round"
              strokeDasharray={`${filled.toFixed(2)} ${gap.toFixed(2)}`}
              className={`${c.ring} transition-all duration-300`} />
          )}
        </svg>

        <div className={`
          absolute inset-[10px] rounded-full flex flex-col items-center justify-center gap-0.5
          transition-colors duration-200
          ${c.innerCls}
        `}>
          <Icon
            className={`size-[24px] ${c.pct} transition-transform duration-200 group-hover:scale-110`}
            strokeWidth={1.7}
          />
          {p >= 0.99 && <span className={`text-[9px] font-bold leading-none ${c.pct}`}>✓</span>}
          {p > 0.01 && p < 0.99 && (
            <span className={`text-[9px] font-bold leading-none ${c.pct}`}>{Math.round(p * 100)}%</span>
          )}
        </div>
      </button>
      <span className="text-[11px] font-medium text-center leading-tight text-foreground/65 max-w-[80px]">
        {label}
      </span>
    </div>
  )
}
