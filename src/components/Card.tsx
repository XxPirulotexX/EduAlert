import type { ReactNode } from 'react'
import { COLORS } from '../theme'

interface Props {
  children: ReactNode
  padding?: string
  accent?: boolean
  onClick?: () => void
}

export default function Card({ children, padding = '16px', accent = false, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: COLORS.card,
        borderRadius: 14,
        padding,
        boxShadow: '0 1px 6px rgba(15,23,42,0.07)',
        border: accent ? '1.5px solid #FDE68A' : '1px solid #F1F5F9',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  )
}