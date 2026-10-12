
import { VOCATIONAL_QUESTIONS } from '../data/mock'
import {
  readStoredData,
  writeStoredData,
} from './storage.service'

// ============================================================
// CLAVES Y LÍMITES DEL ALMACENAMIENTO
// ============================================================

// Los borradores se separan por estudiante.
// Los resultados se guardan en una colección común y se filtran por ID.
const DRAFT_KEY = 'vocational-draft'
const RESULTS_KEY = 'vocational-results'
const MAX_STORED_RESULTS = 300

// ============================================================
// TIPOS DEL MÓDULO VOCACIONAL
// ============================================================

export type VocationalAreaKey =
  | 'tecnologia'
  | 'ciencia'
  | 'creatividad'
  | 'social'
  | 'negocios'

interface VocationalAreaDefinition {
  name: string
  icon: string
  description: string
  options: string[]
}

export interface VocationalAreaResult
  extends VocationalAreaDefinition {
  key: VocationalAreaKey
  score: number
  relativeScore: number
  level: string
}

export interface VocationalTestResult {
  id: string
  completedAt: string

  // Vínculo con el estudiante seleccionado en el modo de demostración.
  // Es opcional para conservar compatibilidad con resultados antiguos.
  studentId?: number

  answers: Record<number, string>
  questionCount: number
  areas: VocationalAreaResult[]
}

// ============================================================
// OBTENCIÓN DEL ESTUDIANTE ACTUAL
// ============================================================

// Lee el ID guardado durante la selección del estudiante en Login.
// Si no existe un ID válido, el flujo funciona como demostración sin cuenta.
export function getCurrentDemoStudentId(): number | undefined {
  const studentId = readStoredData<number | null>(
    'demo-student-id',
    null,
  )

  return typeof studentId === 'number' &&
    Number.isInteger(studentId) &&
    studentId > 0
    ? studentId
    : undefined
}

// Genera una clave independiente para cada borrador.
// Si se accede directamente sin seleccionar estudiante, se conserva
// la clave anterior para no romper el flujo de demostración sin cuenta.
function getDraftStorageKey(studentId?: number): string {
  return studentId
    ? `${DRAFT_KEY}:${studentId}`
    : DRAFT_KEY
}

// Recupera todos los resultados almacenados, ordenados del más reciente
// al más antiguo. Esta función interna no aplica filtros por estudiante.
function getAllStoredResults(): VocationalTestResult[] {
  const stored = readStoredData<VocationalTestResult[]>(
    RESULTS_KEY,
    [],
  )

  // Evita errores si el valor almacenado no tiene la estructura esperada.
  if (!Array.isArray(stored)) {
    return []
  }

  return [...stored].sort(
    (a, b) => b.completedAt.localeCompare(a.completedAt),
  )
}

// ============================================================
// DEFINICIÓN DE ÁREAS VOCACIONALES
// ============================================================

// Contiene las descripciones y los ejemplos de campos de formación.
const AREA_DEFINITIONS: Record<
  VocationalAreaKey,
  VocationalAreaDefinition
> = {
  tecnologia: {
    name: 'Tecnología e ingeniería',
    icon: '💻',
    description:
      'Interés por crear soluciones, resolver problemas técnicos y comprender sistemas.',
    options: [
      'Desarrollo de software',
      'Ingeniería de sistemas',
      'Automatización y robótica',
      'Tecnologías de la información',
    ],
  },

  ciencia: {
    name: 'Ciencia e investigación',
    icon: '🔬',
    description:
      'Interés por investigar, analizar información y comprender fenómenos naturales o sociales.',
    options: [
      'Biología y ciencias naturales',
      'Química',
      'Ciencias ambientales',
      'Investigación científica',
    ],
  },

  creatividad: {
    name: 'Diseño y creatividad',
    icon: '🎨',
    description:
      'Interés por crear ideas, comunicar mensajes y resolver problemas mediante recursos creativos.',
    options: [
      'Diseño gráfico',
      'Diseño de experiencias digitales',
      'Comunicación audiovisual',
      'Artes visuales',
    ],
  },

  social: {
    name: 'Educación, bienestar y sociedad',
    icon: '🤝',
    description:
      'Interés por colaborar con otras personas, comprender la sociedad y contribuir al bienestar.',
    options: [
      'Psicología',
      'Licenciaturas y educación',
      'Trabajo social',
      'Proyectos comunitarios',
    ],
  },

  negocios: {
    name: 'Administración, negocios y comunicación',
    icon: '📊',
    description:
      'Interés por organizar proyectos, desarrollar iniciativas y comunicar propuestas.',
    options: [
      'Administración de empresas',
      'Emprendimiento',
      'Mercadeo',
      'Gestión de proyectos',
    ],
  },
}

// ============================================================
// REGLAS DE CLASIFICACIÓN DE LAS RESPUESTAS
// ============================================================

// Cada pregunta y opción suma un punto al área correspondiente.
// Estas reglas son heurísticas de demostración, no un instrumento
// psicométrico validado ni un modelo de inteligencia artificial.
const ANSWER_AREA_MAP: Record<
  number,
  Record<string, VocationalAreaKey>
> = {
  1: {
    a: 'ciencia',
    b: 'tecnologia',
    c: 'creatividad',
    d: 'social',
  },
  2: {
    a: 'tecnologia',
    b: 'creatividad',
    c: 'tecnologia',
    d: 'negocios',
  },
  3: {
    a: 'ciencia',
    b: 'social',
    c: 'negocios',
    d: 'tecnologia',
  },
  4: {
    a: 'negocios',
    b: 'creatividad',
    c: 'ciencia',
    d: 'social',
  },
  5: {
    a: 'tecnologia',
    b: 'creatividad',
    c: 'tecnologia',
    d: 'social',
  },
  6: {
    a: 'ciencia',
    b: 'social',
    c: 'creatividad',
    d: 'tecnologia',
  },
  7: {
    a: 'social',
    b: 'negocios',
    c: 'negocios',
    d: 'ciencia',
  },
  8: {
    a: 'ciencia',
    b: 'social',
    c: 'creatividad',
    d: 'tecnologia',
  },
  9: {
    a: 'ciencia',
    b: 'negocios',
    c: 'ciencia',
    d: 'social',
  },
  10: {
    a: 'negocios',
    b: 'social',
    c: 'creatividad',
    d: 'negocios',
  },
  11: {
    a: 'ciencia',
    b: 'creatividad',
    c: 'tecnologia',
    d: 'social',
  },
  12: {
    a: 'ciencia',
    b: 'creatividad',
    c: 'social',
    d: 'negocios',
  },
}

// ============================================================
// VALIDACIÓN Y CÁLCULO DE RESULTADOS
// ============================================================

// Comprueba que cada pregunta tenga seleccionada una opción existente.
function validateAnswers(
  answers: Record<number, string>,
): void {
  for (const question of VOCATIONAL_QUESTIONS) {
    const selectedOption = answers[question.id]

    const optionExists = question.options.some(
      (option) => option.id === selectedOption,
    )

    if (!optionExists) {
      throw new Error(
        `Debes responder la pregunta ${question.id} antes de ver tus resultados.`,
      )
    }
  }
}

// Calcula las puntuaciones de las áreas a partir de las respuestas.
function calculateAreas(
  answers: Record<number, string>,
): VocationalAreaResult[] {
  const scores: Record<VocationalAreaKey, number> = {
    tecnologia: 0,
    ciencia: 0,
    creatividad: 0,
    social: 0,
    negocios: 0,
  }

  // Asigna un punto por respuesta al área definida en la clasificación.
  for (const question of VOCATIONAL_QUESTIONS) {
    const optionId = answers[question.id]
    const areaKey = ANSWER_AREA_MAP[question.id]?.[optionId]

    if (!areaKey) {
      throw new Error(
        `No existe una clasificación para la respuesta ${optionId} de la pregunta ${question.id}.`,
      )
    }

    scores[areaKey] += 1
  }

  // La puntuación máxima sirve como referencia para el índice relativo.
  const maximumScore = Math.max(...Object.values(scores))

  return (
    Object.keys(AREA_DEFINITIONS) as VocationalAreaKey[]
  )
    .map((key) => {
      const definition = AREA_DEFINITIONS[key]
      const score = scores[key]

      // Compara cada área con la puntuación más alta obtenida.
      // El índice no representa una probabilidad de éxito profesional.
      const relativeScore =
        maximumScore > 0
          ? Math.round((score / maximumScore) * 100)
          : 0

      let level = 'Área complementaria'

      if (score > 0 && score === maximumScore) {
        level = 'Mayor coincidencia'
      } else if (relativeScore >= 70) {
        level = 'Afinidad relativa media'
      }

      return {
        key,
        ...definition,
        score,
        relativeScore,
        level,
      }
    })
    // Las áreas con mayor puntuación aparecen primero.
    .sort((a, b) => b.score - a.score)
}

// ============================================================
// SERVICIO PÚBLICO
// ============================================================

export const vocationalService = {
  // Recupera el borrador del estudiante indicado.
  // Si no se pasa ID, utiliza el estudiante seleccionado en Login.
  getDraft(
    studentId: number | undefined = getCurrentDemoStudentId(),
  ): Record<number, string> {
    return readStoredData<Record<number, string>>(
      getDraftStorageKey(studentId),
      {},
    )
  },

  // Persiste todas las respuestas seleccionadas hasta el momento.
  saveDraft(
    answers: Record<number, string>,
    studentId: number | undefined = getCurrentDemoStudentId(),
  ): void {
    writeStoredData(
      getDraftStorageKey(studentId),
      answers,
    )
  },

  // Limpia el borrador de un estudiante sin borrar sus resultados anteriores.
  startNewTest(
    studentId: number | undefined = getCurrentDemoStudentId(),
  ): void {
    writeStoredData(
      getDraftStorageKey(studentId),
      {},
    )
  },

  // Devuelve solo los intentos del estudiante solicitado.
  // Sin parámetro, utiliza el estudiante seleccionado en el modo de demostración.
  getResults(
    studentId: number | undefined = getCurrentDemoStudentId(),
  ): VocationalTestResult[] {
    return getAllStoredResults().filter(
      (result) => result.studentId === studentId,
    )
  },

  // Recupera el intento más reciente del estudiante correspondiente.
  getLatestResult(
    studentId: number | undefined = getCurrentDemoStudentId(),
  ): VocationalTestResult | undefined {
    return this.getResults(studentId)[0]
  },

  // Valida las respuestas, calcula las áreas y guarda un intento completo.
  completeTest(
    answers: Record<number, string>,
    studentId: number | undefined = getCurrentDemoStudentId(),
  ): VocationalTestResult {
    validateAnswers(answers)

    // Construye un resultado asociado al estudiante seleccionado.
    const result: VocationalTestResult = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      completedAt: new Date().toISOString(),
      ...(studentId !== undefined ? { studentId } : {}),
      answers: { ...answers },
      questionCount: VOCATIONAL_QUESTIONS.length,
      areas: calculateAreas(answers),
    }

    // Mantiene los intentos anteriores y limita el volumen del historial.
    const updatedHistory = [
      result,
      ...getAllStoredResults(),
    ].slice(0, MAX_STORED_RESULTS)

    // Primero se guarda el resultado. Si falla, las respuestas del borrador
    // siguen disponibles para que el estudiante pueda volver a intentarlo.
    writeStoredData(RESULTS_KEY, updatedHistory)

    // Solo después de guardar el resultado se limpia el borrador correspondiente.
    writeStoredData(
      getDraftStorageKey(studentId),
      {},
    )

    return result
  },
}
