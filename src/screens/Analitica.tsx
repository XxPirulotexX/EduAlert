import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import SectionTitle from '../components/SectionTitle'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import { COLORS } from '../theme'

const academicData = [
  { period: 'P1', value: 3.8 },
  { period: 'P2', value: 3.9 },
  { period: 'P3', value: 3.7 },
  { period: 'P4', value: 3.6 },
  { period: 'P5', value: 3.7 },
]

const riskData = [
  { name: 'Bajo', value: 152, color: COLORS.riskLow },
  { name: 'Medio', value: 71, color: COLORS.riskMid },
  { name: 'Alto', value: 25, color: COLORS.riskHigh },
]

export default function Analitica() {
  const total = riskData.reduce((s, d) => s + d.value, 0)

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ background: '#fff', padding: '16px 20px 14px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.navy, margin: 0, lineHeight: 1.2 }}>Analítica educativa</h1>
          <p style={{ fontSize: 12, color: COLORS.muted, margin: '3px 0 0' }}>Información para apoyar mejores decisiones</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 20px' }} className="no-scrollbar">
          <SectionTitle style={{ marginBottom: 8 }}>Indicadores generales</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { l: 'Analizados', v: '248', u: 'estudiantes', c: COLORS.blue, bg: COLORS.lightBlue },
              { l: 'Asistencia', v: '89%', u: 'promedio', c: COLORS.teal, bg: COLORS.lightTeal },
              { l: 'Prom. académico', v: '3.7', u: 'escala 5.0', c: COLORS.blue, bg: COLORS.lightBlue },
              { l: 'Alertas activas', v: '18', u: 'requieren acción', c: COLORS.riskMid, bg: COLORS.riskMidBg },
            ].map((k) => (
              <div key={k.l} style={{ background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #F1F5F9', boxShadow: '0 1px 4px rgba(15,23,42,0.06)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: k.bg, marginBottom: 10 }} />
                <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.navy, margin: 0, lineHeight: 1 }}>{k.v}</p>
                <p style={{ fontSize: 10, fontWeight: 500, color: COLORS.muted, margin: '4px 0 0' }}>{k.l}</p>
                <p style={{ fontSize: 10, color: COLORS.subtle, margin: 0 }}>{k.u}</p>
              </div>
            ))}
          </div>

          <SectionTitle style={{ marginBottom: 8 }}>Distribución de riesgo</SectionTitle>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #F1F5F9', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: '0 0 120px', height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={34} outerRadius={52} paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}>
                      {riskData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {riskData.map((d) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, color: '#475569' }}>Riesgo {d.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.navy }}>{d.value}</span>
                      </div>
                      <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginTop: 4 }}>
                        <div style={{ height: '100%', width: `${(d.value / total) * 100}%`, background: d.color, borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <SectionTitle style={{ marginBottom: 8 }}>Tendencia académica</SectionTitle>
          <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #F1F5F9', marginBottom: 20 }}>
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={academicData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: COLORS.subtle }} axisLine={false} tickLine={false} />
                  <YAxis domain={[3.4, 4.0]} tick={{ fontSize: 10, fill: COLORS.subtle }} axisLine={false} tickLine={false} tickCount={4} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke={COLORS.blue} strokeWidth={2.5} dot={{ fill: COLORS.blue, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <BottomNav role="docente" />
      </PhoneFrame>
    </PhoneCenter>
  )
}