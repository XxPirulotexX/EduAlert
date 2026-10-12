
import type { ReactNode } from 'react'
import { COLORS, FONT, FRAME_WIDTH } from '../theme'

interface Props {
  children: ReactNode
  bg?: string
  rounded?: boolean
  shadow?: boolean
  desktopLayout?: boolean
}

export default function PhoneFrame({
  children,
  bg = COLORS.bg,
  rounded = true,
  shadow = true,
  desktopLayout = false,
}: Props) {
  return (
    <div
      className={`ea-phone-frame${desktopLayout ? ' ea-phone-frame--desktop' : ''}`}
      style={{
        width: '100%',
        maxWidth: desktopLayout ? 'none' : FRAME_WIDTH,
        height: desktopLayout ? '100vh' : '100%',
        minHeight: 0,
        background: bg,
        fontFamily: FONT,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: desktopLayout ? 0 : rounded ? 36 : 0,
        boxShadow: desktopLayout
          ? 'none'
          : shadow
            ? '0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)'
            : 'none',
      }}
    >
      {children}
    </div>
  )
}

export function PhoneCenter({
  children,
  bg = '#E2E8F0',
}: {
  children: ReactNode
  bg?: string
}) {
  return (
    <div
      className="ea-phone-center"
      style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        width: '100%',
        minHeight: '100vh',
        background: bg,
      }}
    >
      {children}
    </div>
  )
}
