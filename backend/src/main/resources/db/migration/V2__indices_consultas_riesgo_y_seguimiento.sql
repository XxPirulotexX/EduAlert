
-- Acelera la consulta de la evaluación más reciente
-- y el historial de evaluaciones de un estudiante.
CREATE INDEX idx_evaluacion_riesgo_estudiante_fecha
    ON public.evaluacion_riesgo
    (estudiante_id, creado_en DESC, id DESC);

-- Acelera la consulta del historial de seguimiento
-- de una alerta, ordenado del más reciente al más antiguo.
CREATE INDEX idx_seguimiento_alerta_fecha
    ON public.seguimiento_alerta
    (alerta_id, creado_en DESC, id DESC);
