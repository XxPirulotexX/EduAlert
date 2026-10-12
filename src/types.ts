
export type Risk = 'bajo' | 'medio' | 'alto'

export type AlertStatus = 'Nueva' | 'En seguimiento' | 'Revisada'

export type Role =
  | 'administrador'
  | 'docente'
  | 'orientador'
  | 'estudiante'

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
  studentId?: number
  initials: string
  name: string
  grade: string
  risk: Risk
  signal: string
  time: string
  status: AlertStatus
  avatarBg: string
}

export interface AlertFollowUp {
  id: string
  alertId: number
  date: string
  responsible: string
  notes: string
}

export interface SubjectPerformance {
  subject: string
  previousGrade: number
  currentGrade: number
}

export interface PeriodAverage {
  period: string
  average: number
}

export interface StudentPerformance {
  studentId: number
  subjects: SubjectPerformance[]
  periods: PeriodAverage[]
}

export type AttendanceStatus =
  | 'Presente'
  | 'Retardo'
  | 'Ausencia justificada'
  | 'Ausencia sin justificar'

export interface AttendanceEntry {
  date: string
  status: AttendanceStatus
  note: string
}

export interface StudentAttendance {
  studentId: number
  totalClasses: number
  attended: number
  absences: number
  justifiedAbsences: number
  unexcusedAbsences: number
  lateArrivals: number
  recentEntries: AttendanceEntry[]
}
