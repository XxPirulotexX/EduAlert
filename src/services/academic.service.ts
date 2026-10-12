
import type {
  AttendanceEntry,
  AttendanceStatus,
  PeriodAverage,
  Risk,
  Student,
  StudentAttendance,
  StudentPerformance,
  SubjectPerformance,
} from '../types'

import { studentsService } from './students.service'
import {
  readStoredData,
  writeStoredData,
} from './storage.service'

const PERFORMANCE_KEY = 'student-performance'
const ATTENDANCE_KEY = 'student-attendance'

const CORE_SUBJECTS = [
  'Matemáticas',
  'Lengua Castellana',
  'Ciencias Naturales',
  'Ciencias Sociales',
  'Inglés',
]

const RECENT_DATES = [
  '2026-09-28',
  '2026-09-29',
  '2026-09-30',
  '2026-10-01',
  '2026-10-02',
  '2026-10-05',
  '2026-10-06',
  '2026-10-07',
  '2026-10-08',
  '2026-10-09',
]

const GRADE_OFFSETS = [-0.2, -0.1, 0, 0.1, 0.2]

function roundGrade(value: number): number {
  return Math.round(value * 10) / 10
}

function clampGrade(value: number): number {
  return roundGrade(Math.min(5, Math.max(1, value)))
}

function getSubjects(student: Student): string[] {
  return Array.from(
    new Set([student.subject, ...CORE_SUBJECTS]),
  ).slice(0, 5)
}

function getPreviousGradeOffset(risk: Risk): number {
  if (risk === 'alto') return 0.3
  if (risk === 'medio') return 0.1
  return -0.2
}

function getPeriodOffsets(risk: Risk): number[] {
  if (risk === 'alto') return [0.4, 0.2, 0]
  if (risk === 'medio') return [-0.1, 0.1, 0]
  return [-0.3, -0.1, 0]
}

function createPerformance(
  student: Student,
): StudentPerformance {
  const previousOffset = getPreviousGradeOffset(student.risk)

  const subjects: SubjectPerformance[] = getSubjects(student).map(
    (subject, index) => {
      const offset =
        GRADE_OFFSETS[
          (index + student.id) % GRADE_OFFSETS.length
        ]

      const currentGrade = clampGrade(student.avg + offset)

      return {
        subject,
        currentGrade,
        previousGrade: clampGrade(
          currentGrade + previousOffset,
        ),
      }
    },
  )

  const periodOffsets = getPeriodOffsets(student.risk)

  const periods: PeriodAverage[] = [
    {
      period: 'Periodo 1',
      average: clampGrade(student.avg + periodOffsets[0]),
    },
    {
      period: 'Periodo 2',
      average: clampGrade(student.avg + periodOffsets[1]),
    },
    {
      period: 'Periodo actual',
      average: clampGrade(student.avg + periodOffsets[2]),
    },
  ]

  return {
    studentId: student.id,
    subjects,
    periods,
  }
}

function getAttendanceTarget(student: Student): number {
  const variation = (student.id * 3) % 7

  if (student.risk === 'alto') return 76 + variation
  if (student.risk === 'medio') return 84 + variation
  return 92 + variation
}

function getSimulatedAttendanceStatus(
  student: Student,
  index: number,
  target: number,
): AttendanceStatus {
  const value = (student.id * 17 + index * 23) % 100

  if (value < target - 8) return 'Presente'
  if (value < target) return 'Retardo'
  if (value < target + 3) return 'Ausencia justificada'

  return 'Ausencia sin justificar'
}

function getAttendanceNote(status: AttendanceStatus): string {
  switch (status) {
    case 'Presente':
      return 'Asistencia registrada (simulada).'
    case 'Retardo':
      return 'Ingreso posterior a la hora de inicio (simulado).'
    case 'Ausencia justificada':
      return 'Ausencia justificada (registro simulado).'
    case 'Ausencia sin justificar':
      return 'Ausencia sin justificar (registro simulado).'
  }
}

function createAttendance(
  student: Student,
): StudentAttendance {
  const totalClasses = 60
  const target = getAttendanceTarget(student)

  const attended = Math.round(
    (totalClasses * target) / 100,
  )

  const absences = totalClasses - attended

  const justifiedAbsences = Math.min(
    absences,
    student.id % 3,
  )

  const unexcusedAbsences =
    absences - justifiedAbsences

  const lateArrivals = Math.min(
    attended,
    student.risk === 'alto'
      ? 4 + (student.id % 4)
      : student.risk === 'medio'
        ? 2 + (student.id % 3)
        : student.id % 2,
  )

  const recentEntries: AttendanceEntry[] =
    RECENT_DATES.map((date, index) => {
      const status = getSimulatedAttendanceStatus(
        student,
        index,
        target,
      )

      return {
        date,
        status,
        note: getAttendanceNote(status),
      }
    })

  return {
    studentId: student.id,
    totalClasses,
    attended,
    absences,
    justifiedAbsences,
    unexcusedAbsences,
    lateArrivals,
    recentEntries,
  }
}

function getAllRecords<T>(
  key: string,
  createRecord: (student: Student) => T,
  getStudentId: (record: T) => number,
): T[] {
  const students = studentsService.getAll()

  const validStudentIds = new Set(
    students.map((student) => student.id),
  )

  const storedRecords = readStoredData<T[]>(key, [])

  // Elimina registros de estudiantes que ya no existen.
  const records = storedRecords.filter((record) =>
    validStudentIds.has(getStudentId(record)),
  )

  const knownIds = new Set(
    records.map(getStudentId),
  )

  // Agrega los registros de estudiantes nuevos.
  const missingRecords = students
    .filter((student) => !knownIds.has(student.id))
    .map(createRecord)

  if (
    missingRecords.length > 0 ||
    records.length !== storedRecords.length
  ) {
    const updatedRecords = [
      ...records,
      ...missingRecords,
    ]

    writeStoredData(key, updatedRecords)

    return updatedRecords
  }

  return records
}

function getAllPerformance(): StudentPerformance[] {
  return getAllRecords<StudentPerformance>(
    PERFORMANCE_KEY,
    createPerformance,
    (record) => record.studentId,
  )
}

function getAllAttendance(): StudentAttendance[] {
  return getAllRecords<StudentAttendance>(
    ATTENDANCE_KEY,
    createAttendance,
    (record) => record.studentId,
  )
}

export const studentAcademicService = {
  getPerformanceByStudentId(
    studentId: number,
  ): StudentPerformance | undefined {
    return getAllPerformance().find(
      (record) => record.studentId === studentId,
    )
  },

  getAttendanceByStudentId(
    studentId: number,
  ): StudentAttendance | undefined {
    return getAllAttendance().find(
      (record) => record.studentId === studentId,
    )
  },
}
