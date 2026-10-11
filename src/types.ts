export type Risk = 'bajo' | 'medio' | 'alto'

export type AlertStatus = 'Nueva' | 'En seguimiento' | 'Revisada'

export type Role = 'administrador' | 'docente' | 'orientador' | 'estudiante'

export interface Student {
  id: number
  name: string
  grade: string
  avg: number
  risk: Risk
  initials: string
  subject: string
}

export interface Alert {
  id: number
  initials: string
  name: string
  grade: string
  risk: Risk
  signal: string
  time: string
  status: AlertStatus
  avatarBg: string
}