import type { ReactNode } from 'react'
import { COLORS } from '../theme'

export default function SectionTitle({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <p
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: COLORS.muted,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        margin: 0,
        ...style,
      }}
    >
      {children}
    </p>
  )
}