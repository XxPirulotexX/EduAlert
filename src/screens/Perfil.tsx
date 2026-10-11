import PhoneFrame, { PhoneCenter } from '../components/PhoneFrame'
import BottomNav from '../components/BottomNav'
import Card from '../components/Card'
import { ChevronRight } from '../components/icons'
import { COLORS } from '../theme'

type Role = 'administrador' | 'docente' | 'orientador' | 'estudiante'

const USER = {
  initials: 'DA',
  name: 'Duvan Alquichides',
  role: 'Orientador escolar',
  roleKey: 'orientador' as Role,
  email: 'd.alquichides@edualerta.edu.co',
  institution: 'I.E. Técnica Industrial',
}

const ROLE_BADGE: Record<Role, { bg: string; text: string; border: string }> = {
  administrador: { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' },
  docente: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' },
  orientador: { bg: '#F0FDFA', text: '#0D9488', border: '#99F6E4' },
  estudiante: { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' },
}

function SectionGroup({ title, items }: { title: string; items: { title: string; description: string }[] }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: COLORS.subtle,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        marginBottom: 8, paddingLeft: 4,
      }}>{title}</p>
      <Card padding="0">
        {items.map((item, i) => (
          <button key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            width: '100%', padding: '13px 16px',
            borderBottom: i < items.length - 1 ? '1px solid #F1F5F9' : 'none',
            background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F1F5F9', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.navy, margin: 0 }}>{item.title}</p>
              <p style={{ fontSize: 12, color: COLORS.subtle, margin: '1px 0 0' }}>{item.description}</p>
            </div>
            <ChevronRight />
          </button>
        ))}
      </Card>
    </div>
  )
}

export default function Perfil() {
  const badge = ROLE_BADGE[USER.roleKey]

  return (
    <PhoneCenter>
      <PhoneFrame>
        <div style={{ background: '#fff', borderBottom: '1px solid #F1F5F9', padding: '16px 20px', flexShrink: 0 }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: COLORS.navy, margin: 0 }}>Perfil y configuración</p>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }} className="no-scrollbar">
          <div style={{
            background: '#fff', borderRadius: 16, padding: '20px',
            marginBottom: 20, boxShadow: '0 1px 4px rgba(15,23,42,0.06)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #2563EB 0%, #14B8A6 100%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 62, height: 62, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB 0%, #14B8A6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 22, color: '#fff',
              }}>{USER.initials}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: COLORS.navy, margin: 0 }}>{USER.name}</p>
                <span style={{
                  display: 'inline-block', marginTop: 5,
                  fontSize: 11, fontWeight: 600,
                  color: badge.text, background: badge.bg,
                  border: `1px solid ${badge.border}`,
                  borderRadius: 6, padding: '2px 8px',
                }}>{USER.role}</span>
                <p style={{ fontSize: 12, color: COLORS.subtle, margin: '6px 0 0' }}>{USER.email}</p>
              </div>
            </div>
          </div>

          <SectionGroup title="Mi información" items={[
            { title: 'Información personal', description: 'Datos de identificación y contacto' },
            { title: 'Editar perfil', description: 'Actualiza tu foto y datos visibles' },
          ]} />

          <SectionGroup title="Configuración" items={[
            { title: 'Notificaciones', description: 'Alertas, avisos y recordatorios' },
            { title: 'Preferencias', description: 'Idioma, apariencia y accesibilidad' },
            { title: 'Seguridad', description: 'Cambia tu contraseña y acceso' },
          ]} />

          <SectionGroup title="Ayuda" items={[
            { title: 'Centro de ayuda', description: 'Guías y preguntas frecuentes' },
            { title: 'Acerca de EduAlerta', description: 'Versión, licencias e información legal' },
          ]} />

          <Card padding="0">
            <button style={{
              display: 'flex', alignItems: 'center', gap: 12,
              width: '100%', padding: '13px 16px',
              background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.riskHigh, margin: 0 }}>Cerrar sesión</p>
                <p style={{ fontSize: 12, color: '#FCA5A5', margin: '1px 0 0' }}>Salir de tu cuenta actual</p>
              </div>
            </button>
          </Card>
        </div>

        <BottomNav role="docente" />
      </PhoneFrame>
    </PhoneCenter>
  )
}