import type { Risk } from '../types'
import { COLORS } from '../theme'

const CFG: Record<Risk, { label: string; color: string; bg: string }> = {
  bajo: { label: 'Riesgo bajo', color: '#15803D', bg: COLORS.riskLowBg },
  medio: { label: 'Riesgo medio', color: '#92400E', bg: COLORS.riskMidBg },
  alto: { label: 'Riesgo alto', color: '#991B1B', bg: COLORS.riskHighBg },
}

const DOT: Record<Risk, string> = {
  bajo: COLORS.riskLow,
  medio: COLORS.riskMid,
  alto: COLORS.riskHigh,
}

export default function RiskBadge({ risk }: { risk: Risk }) {
  const cfg = CFG[risk]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        padding: '2px 8px',
        borderRadius: 20,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: DOT[risk] }} />
      {cfg.label}
    </span>
  )
}