-- Datos demostrativos opcionales para la presentación de EduAlerta.
-- Ejecutar solo después de iniciar Spring Boot al menos una vez para que JPA cree las tablas.
-- El script es repetible: evita duplicar estudiantes por código y relaciones por señal.

INSERT INTO estudiante
    (codigo_estudiantil, nombres, apellidos, estado, grado, promedio_actual, creado_en)
VALUES
    ('EA-DEMO-001', 'Juan', 'Pérez', 'activo', '11°', 3.80, CURRENT_TIMESTAMP),
    ('EA-DEMO-002', 'María', 'López', 'activo', '10°', 4.20, CURRENT_TIMESTAMP),
    ('EA-DEMO-003', 'Carlos', 'Rodríguez', 'activo', '11°', 2.90, CURRENT_TIMESTAMP),
    ('EA-DEMO-004', 'Ana', 'Martínez', 'activo', '10°', 4.50, CURRENT_TIMESTAMP),
    ('EA-DEMO-005', 'Luis', 'García', 'activo', '11°', 3.10, CURRENT_TIMESTAMP),
    ('EA-DEMO-006', 'Sara', 'Fernández', 'activo', '10°', 3.60, CURRENT_TIMESTAMP),
    ('EA-DEMO-007', 'Diego', 'Torres', 'activo', '11°', 4.10, CURRENT_TIMESTAMP),
    ('EA-DEMO-008', 'Valentina', 'Cruz', 'activo', '10°', 2.70, CURRENT_TIMESTAMP),
    ('EA-DEMO-009', 'Andrés', 'Jiménez', 'activo', '11°', 3.90, CURRENT_TIMESTAMP),
    ('EA-DEMO-010', 'Camila', 'Morales', 'activo', '10°', 3.40, CURRENT_TIMESTAMP),
    ('EA-DEMO-011', 'Sebastián', 'Vargas', 'activo', '11°', 2.50, CURRENT_TIMESTAMP),
    ('EA-DEMO-012', 'Isabella', 'Reyes', 'activo', '10°', 4.70, CURRENT_TIMESTAMP)
ON CONFLICT (codigo_estudiantil) DO NOTHING;

-- Se registra una evaluación de riesgo manual inicial por estudiante de demostración.
-- Estos valores sirven para probar la persistencia y NO son predicciones de IA validadas.
INSERT INTO evaluacion_riesgo (estudiante_id, nivel, observaciones, fuente, creado_en)
SELECT e.id, v.nivel, v.observaciones, 'DEMO', CURRENT_TIMESTAMP
FROM (VALUES
    ('EA-DEMO-001', 'medio', 'Variación reciente del rendimiento. Registro demostrativo.'),
    ('EA-DEMO-002', 'bajo', 'Sin señales prioritarias registradas en este ejemplo.'),
    ('EA-DEMO-003', 'alto', 'Promedio actual inferior al objetivo de referencia del ejemplo.'),
    ('EA-DEMO-004', 'bajo', 'Sin señales prioritarias registradas en este ejemplo.'),
    ('EA-DEMO-005', 'alto', 'Requiere revisión humana de su situación académica.'),
    ('EA-DEMO-006', 'medio', 'Variación de asistencia para revisar.'),
    ('EA-DEMO-007', 'bajo', 'Sin señales prioritarias registradas en este ejemplo.'),
    ('EA-DEMO-008', 'alto', 'Promedio actual inferior al objetivo de referencia del ejemplo.'),
    ('EA-DEMO-009', 'bajo', 'Sin señales prioritarias registradas en este ejemplo.'),
    ('EA-DEMO-010', 'medio', 'Se recomienda revisar la evolución académica.'),
    ('EA-DEMO-011', 'alto', 'Requiere revisión humana de su situación académica.'),
    ('EA-DEMO-012', 'bajo', 'Sin señales prioritarias registradas en este ejemplo.')
) AS v(codigo, nivel, observaciones)
JOIN estudiante e ON e.codigo_estudiantil = v.codigo
WHERE NOT EXISTS (
    SELECT 1 FROM evaluacion_riesgo r
    WHERE r.estudiante_id = e.id AND r.fuente = 'DEMO'
);

-- Las alertas de demostración quedan vinculadas a estudiantes persistidos.
INSERT INTO alerta_temprana (estudiante_id, senal, nivel_riesgo, estado, creado_en)
SELECT e.id, v.senal, v.nivel, v.estado, CURRENT_TIMESTAMP
FROM (VALUES
    ('EA-DEMO-001', 'Variación reciente en rendimiento y asistencia.', 'alto', 'Nueva'),
    ('EA-DEMO-002', 'Revisar variación reciente en asistencia.', 'medio', 'En seguimiento'),
    ('EA-DEMO-003', 'Promedio bajo que requiere acompañamiento.', 'alto', 'Nueva'),
    ('EA-DEMO-005', 'Descenso de resultados en evaluaciones recientes.', 'alto', 'En seguimiento'),
    ('EA-DEMO-006', 'Variación en registros de asistencia.', 'medio', 'Nueva'),
    ('EA-DEMO-008', 'Ausencias consecutivas registradas en el ejemplo.', 'alto', 'Revisada')
) AS v(codigo, senal, nivel, estado)
JOIN estudiante e ON e.codigo_estudiantil = v.codigo
WHERE NOT EXISTS (
    SELECT 1 FROM alerta_temprana a
    WHERE a.estudiante_id = e.id AND a.senal = v.senal
);

-- Añade una nota demostrativa solo si existe la cuenta administrativa bootstrap.
INSERT INTO seguimiento_alerta (alerta_id, responsable_usuario_id, observaciones, creado_en)
SELECT a.id, u.id, 'Registro de seguimiento inicial de demostración. Verificar la situación con el estudiante.', CURRENT_TIMESTAMP
FROM alerta_temprana a
JOIN estudiante e ON e.id = a.estudiante_id
JOIN usuario u ON LOWER(u.correo) = LOWER('admin@edualerta.local')
WHERE e.codigo_estudiantil = 'EA-DEMO-001'
  AND a.senal = 'Variación reciente en rendimiento y asistencia.'
  AND NOT EXISTS (
      SELECT 1 FROM seguimiento_alerta s WHERE s.alerta_id = a.id
  );
