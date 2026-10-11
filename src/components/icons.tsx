import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number; color?: string }

const base = (size = 22) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
})

export function HomeIcon({ active, size, color }: { active?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? '#2563EB' : '#94A3B8')
  return (
    <svg {...base(size)} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

export function StudentsIcon({ active, size, color }: { active?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? '#2563EB' : '#94A3B8')
  return (
    <svg {...base(size)} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
    </svg>
  )
}

export function AlertIcon({ active, size, color }: { active?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? '#2563EB' : '#94A3B8')
  return (
    <svg {...base(size)} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

export function AnalyticsIcon({ active, size, color }: { active?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? '#2563EB' : '#94A3B8')
  return (
    <svg {...base(size)} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

export function ProfileIcon({ active, size, color }: { active?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? '#2563EB' : '#94A3B8')
  return (
    <svg {...base(size)} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

export function ProgressIcon({ active, size, color }: { active?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? '#2563EB' : '#94A3B8')
  return (
    <svg {...base(size)} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export function OrientationIcon({ active, size, color }: { active?: boolean; size?: number; color?: string }) {
  const c = color ?? (active ? '#2563EB' : '#94A3B8')
  return (
    <svg {...base(size)} stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8l-4 8 4-2 4 2-4-8z" />
    </svg>
  )
}

export function ChevronRight({ size = 16, color = '#CBD5E1' }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function ChevronLeft({ size = 20, color = '#0F172A' }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function FilterIcon({ size = 20, color = '#64748B' }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="18" x2="14" y2="18" />
    </svg>
  )
}

export function InfoIcon({ size = 16, color = '#2563EB' }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

export function MailIcon({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  )
}

export function LockIcon({ size = 18, color = 'currentColor' }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function EyeIcon({ open, size = 18, color = 'currentColor' }: IconProps & { open: boolean }) {
  if (open) {
    return (
      <svg {...base(size)} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    )
  }
  return (
    <svg {...base(size)} stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

export function SearchIcon({ size = 18, color = '#94A3B8' }: IconProps) {
  return (
    <svg {...base(size)} stroke={color} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

export function SignalIcon() {
  return (
    <svg width={15} height={12} viewBox="0 0 15 12" fill="#0F172A">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="4" y="5" width="3" height="7" rx="1" />
      <rect x="8" y="2" width="3" height="10" rx="1" />
      <rect x="12" y="0" width="3" height="12" rx="1" opacity="0.3" />
    </svg>
  )
}

export function WifiIcon() {
  return (
    <svg width={15} height={12} viewBox="0 0 24 18" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round">
      <path d="M1 6C5.5 1.5 18.5 1.5 23 6" />
      <path d="M4.5 10C7.5 7 16.5 7 19.5 10" />
      <path d="M8.5 14C10 12.5 14 12.5 15.5 14" />
      <circle cx="12" cy="17" r="1.5" fill="#0F172A" stroke="none" />
    </svg>
  )
}

export function BatteryIcon() {
  return (
    <svg width={24} height={12} viewBox="0 0 24 12" fill="none">
      <rect x="0.5" y="0.5" width="20" height="11" rx="3" stroke="#0F172A" strokeWidth="1.2" />
      <rect x="2" y="2" width="15" height="8" rx="1.5" fill="#0F172A" />
      <path d="M21.5 4v4c1.1-.5 1.5-1 1.5-2s-.4-1.5-1.5-2z" fill="#0F172A" />
    </svg>
  )
}