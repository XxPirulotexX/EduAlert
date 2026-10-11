import type { ReactNode } from 'react'
import { COLORS, FONT, FRAME_HEIGHT, FRAME_WIDTH } from '../theme'

interface Props {
  children: ReactNode
  bg?: string
  rounded?: boolean
  shadow?: boolean
}

export default function PhoneFrame({ children, bg = COLORS.bg, rounded = true, shadow = true }: Props) {
  return (
    <div
      style={{
        width: FRAME_WIDTH,
        height: FRAME_HEIGHT,
        background: bg,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: rounded ? 36 : 0,
        boxShadow: shadow ? '0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)' : 'none',
      }}
    >
      {children}
    </div>
  )
}

export function PhoneCenter({ children, bg = '#E2E8F0' }: { children: ReactNode; bg?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: bg,
      }}
    >
      {children}
    </div>
  )
}