import type { Alert, Student } from '../types'

export const STUDENTS: Student[] = [
  { id: 1, name: 'Juan Pérez', grade: '11°', avg: 3.8, risk: 'medio', initials: 'JP', subject: 'Matemáticas' },
  { id: 2, name: 'María López', grade: '10°', avg: 4.2, risk: 'bajo', initials: 'ML', subject: 'Ciencias' },
  { id: 3, name: 'Carlos Rodríguez', grade: '11°', avg: 2.9, risk: 'alto', initials: 'CR', subject: 'Historia' },
  { id: 4, name: 'Ana Martínez', grade: '10°', avg: 4.5, risk: 'bajo', initials: 'AM', subject: 'Lengua' },
  { id: 5, name: 'Luis García', grade: '11°', avg: 3.1, risk: 'alto', initials: 'LG', subject: 'Física' },
  { id: 6, name: 'Sara Fernández', grade: '10°', avg: 3.6, risk: 'medio', initials: 'SF', subject: 'Química' },
  { id: 7, name: 'Diego Torres', grade: '11°', avg: 4.1, risk: 'bajo', initials: 'DT', subject: 'Inglés' },
  { id: 8, name: 'Valentina Cruz', grade: '10°', avg: 2.7, risk: 'alto', initials: 'VC', subject: 'Matemáticas' },
  { id: 9, name: 'Andrés Jiménez', grade: '11°', avg: 3.9, risk: 'bajo', initials: 'AJ', subject: 'Biología' },
  { id: 10, name: 'Camila Morales', grade: '10°', avg: 3.4, risk: 'medio', initials: 'CM', subject: 'Arte' },
  { id: 11, name: 'Sebastián Vargas', grade: '11°', avg: 2.5, risk: 'alto', initials: 'SV', subject: 'Educación Física' },
  { id: 12, name: 'Isabella Reyes', grade: '10°', avg: 4.7, risk: 'bajo', initials: 'IR', subject: 'Ciencias' },
]

export const ALERTS: Alert[] = [
  { id: 1, initials: 'JP', name: 'Juan Pérez', grade: '11°', risk: 'alto', signal: 'Disminución del rendimiento y asistencia', time: 'Hace 2 días', status: 'Nueva', avatarBg: '#EF4444' },
  { id: 2, initials: 'ML', name: 'María López', grade: '10°', risk: 'medio', signal: 'Variación reciente en la asistencia', time: 'Hace 4 días', status: 'En seguimiento', avatarBg: '#F59E0B' },
  { id: 3, initials: 'CR', name: 'Carlos Rodríguez', grade: '11°', risk: 'bajo', signal: 'Cambios leves en el rendimiento', time: 'Hace 1 semana', status: 'Revisada', avatarBg: '#22C55E' },
  { id: 4, initials: 'AT', name: 'Andrea Torres', grade: '9°', risk: 'alto', signal: 'Ausencias consecutivas sin justificación', time: 'Hace 1 día', status: 'Nueva', avatarBg: '#EF4444' },
  { id: 5, initials: 'DM', name: 'Diego Morales', grade: '10°', risk: 'medio', signal: 'Bajo desempeño en evaluaciones recientes', time: 'Hace 3 días', status: 'En seguimiento', avatarBg: '#F59E0B' },
  { id: 6, initials: 'SV', name: 'Sofía Vargas', grade: '8°', risk: 'bajo', signal: 'Leve disminución en participación', time: 'Hace 5 días', status: 'Revisada', avatarBg: '#22C55E' },
]

export const VOCATIONAL_QUESTIONS = [
  {
    id: 1,
    category: 'INTERESES',
    text: '¿Qué tipo de actividades disfrutas más en tu tiempo libre?',
    options: [
      { id: 'a', emoji: '🔬', label: 'Investigar y descubrir cómo funcionan las cosas' },
      { id: 'b', emoji: '💻', label: 'Crear soluciones utilizando tecnología' },
      { id: 'c', emoji: '🎨', label: 'Diseñar y dar vida a nuevas ideas' },
      { id: 'd', emoji: '🤝', label: 'Ayudar y trabajar con otras personas' },
    ],
  },
  {
    id: 2,
    category: 'HABILIDADES',
    text: '¿En cuál de estas áreas sientes que tienes más facilidad?',
    options: [
      { id: 'a', emoji: '📊', label: 'Analizar datos y resolver problemas lógicos' },
      { id: 'b', emoji: '✍️', label: 'Expresarme a través de la escritura o el lenguaje' },
      { id: 'c', emoji: '🔧', label: 'Construir o reparar cosas con mis manos' },
      { id: 'd', emoji: '🎤', label: 'Comunicarme y persuadir a otros' },
    ],
  },
  {
    id: 3,
    category: 'PREFERENCIAS',
    text: '¿Cómo prefieres trabajar habitualmente?',
    options: [
      { id: 'a', emoji: '🧩', label: 'Solo, con concentración y autonomía' },
      { id: 'b', emoji: '👥', label: 'En equipo, colaborando con otros' },
      { id: 'c', emoji: '🔄', label: 'Combinando trabajo individual y grupal' },
      { id: 'd', emoji: '🌍', label: 'En entornos cambiantes con nuevos retos' },
    ],
  },
  {
    id: 4,
    category: 'ACTIVIDADES',
    text: '¿Cuál de estas actividades te parece más atractiva?',
    options: [
      { id: 'a', emoji: '🏗️', label: 'Planificar y organizar proyectos complejos' },
      { id: 'b', emoji: '🎵', label: 'Crear o interpretar arte, música o teatro' },
      { id: 'c', emoji: '🌱', label: 'Trabajar con la naturaleza y el medio ambiente' },
      { id: 'd', emoji: '⚖️', label: 'Defender derechos y buscar la justicia social' },
    ],
  },
  {
    id: 5,
    category: 'INTERESES',
    text: '¿Qué tipo de contenido consumes con más frecuencia?',
    options: [
      { id: 'a', emoji: '📰', label: 'Noticias sobre ciencia y tecnología' },
      { id: 'b', emoji: '📚', label: 'Libros, historias o documentales culturales' },
      { id: 'c', emoji: '💡', label: 'Tutoriales o proyectos para aprender haciendo' },
      { id: 'd', emoji: '🗣️', label: 'Debates, podcasts o temas de actualidad social' },
    ],
  },
  {
    id: 6,
    category: 'HABILIDADES',
    text: 'Cuando tienes un problema difícil, ¿qué haces primero?',
    options: [
      { id: 'a', emoji: '🔍', label: 'Busco información y analizo posibles causas' },
      { id: 'b', emoji: '💬', label: 'Hablo con alguien para escuchar distintas opiniones' },
      { id: 'c', emoji: '✏️', label: 'Dibujo o escribo ideas para organizarme' },
      { id: 'd', emoji: '⚡', label: 'Actúo de inmediato con lo que tengo disponible' },
    ],
  },
  {
    id: 7,
    category: 'PREFERENCIAS',
    text: '¿Qué describe mejor tu entorno ideal de trabajo?',
    options: [
      { id: 'a', emoji: '🏥', label: 'Un lugar donde ayudo a mejorar el bienestar de las personas' },
      { id: 'b', emoji: '🏢', label: 'Una empresa o institución con estructura clara' },
      { id: 'c', emoji: '🚀', label: 'Un proyecto propio o una startup innovadora' },
      { id: 'd', emoji: '🎓', label: 'Un espacio académico o de investigación' },
    ],
  },
  {
    id: 8,
    category: 'ACTIVIDADES',
    text: '¿En qué tipo de proyectos escolares te sientes más cómodo/a?',
    options: [
      { id: 'a', emoji: '🧪', label: 'Experimentos o proyectos de investigación' },
      { id: 'b', emoji: '📣', label: 'Presentaciones o debates ante el grupo' },
      { id: 'c', emoji: '🎞️', label: 'Proyectos creativos como videos, maquetas o diseños' },
      { id: 'd', emoji: '📐', label: 'Ejercicios matemáticos o de resolución técnica' },
    ],
  },
  {
    id: 9,
    category: 'INTERESES',
    text: '¿Cuál de estos temas te genera más curiosidad?',
    options: [
      { id: 'a', emoji: '🧬', label: 'La salud, el cuerpo humano y las ciencias de la vida' },
      { id: 'b', emoji: '🌐', label: 'La economía, los negocios y el emprendimiento' },
      { id: 'c', emoji: '🛸', label: 'El espacio, la física y los límites del universo' },
      { id: 'd', emoji: '🏛️', label: 'La historia, la política y las sociedades humanas' },
    ],
  },
  {
    id: 10,
    category: 'HABILIDADES',
    text: '¿Qué valorarías más en tu futuro trabajo?',
    options: [
      { id: 'a', emoji: '💰', label: 'Estabilidad económica y un buen salario' },
      { id: 'b', emoji: '❤️', label: 'Tener un impacto positivo en la vida de otros' },
      { id: 'c', emoji: '🎯', label: 'Hacer algo que realmente me apasione' },
      { id: 'd', emoji: '🌟', label: 'Reconocimiento y crecimiento profesional' },
    ],
  },
  {
    id: 11,
    category: 'PREFERENCIAS',
    text: '¿Cómo prefieres aprender algo nuevo?',
    options: [
      { id: 'a', emoji: '📖', label: 'Leyendo libros o artículos detallados' },
      { id: 'b', emoji: '🎬', label: 'Viendo videos o ejemplos visuales' },
      { id: 'c', emoji: '🛠️', label: 'Probando y aprendiendo con la práctica' },
      { id: 'd', emoji: '💭', label: 'Discutiéndolo con otras personas' },
    ],
  },
  {
    id: 12,
    category: 'ACTIVIDADES',
    text: 'Si pudieras elegir una actividad para este fin de semana, ¿cuál sería?',
    options: [
      { id: 'a', emoji: '🔭', label: 'Visitar un museo de ciencia o tecnología' },
      { id: 'b', emoji: '🎭', label: 'Ir a un espectáculo artístico o cultural' },
      { id: 'c', emoji: '🌿', label: 'Hacer voluntariado en mi comunidad' },
      { id: 'd', emoji: '📈', label: 'Asistir a una feria de emprendimiento o negocios' },
    ],
  },
]