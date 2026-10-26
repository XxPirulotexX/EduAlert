-- Índices alineados con los filtros y ordenamientos del código Java.
-- pg_trgm permite acelerar búsquedas LIKE '%texto%' cuando la cardinalidad lo justifica.
-- En bases administradas, habilitar pg_trgm con el rol DBA antes de ejecutar esta migración.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Lista de estudiantes: filtros normalizados y orden estable.
CREATE INDEX IF NOT EXISTS idx_estudiante_estado_grado_nombre
    ON public.estudiante (lower(estado), lower(grado), lower(apellidos), lower(nombres), id);
CREATE INDEX IF NOT EXISTS idx_estudiante_codigo_trgm
    ON public.estudiante USING gin (lower(codigo_estudiantil) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_estudiante_nombres_trgm
    ON public.estudiante USING gin (lower(nombres) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_estudiante_apellidos_trgm
    ON public.estudiante USING gin (lower(apellidos) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_estudiante_grado_trgm
    ON public.estudiante USING gin (lower(grado) gin_trgm_ops);

-- Alertas: estado/riesgo más recientes, relación con estudiante y búsqueda en señal.
CREATE INDEX IF NOT EXISTS idx_alerta_fecha_id
    ON public.alerta_temprana (creado_en DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_alerta_estado_fecha_id
    ON public.alerta_temprana (lower(estado), creado_en DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_alerta_riesgo_fecha_id
    ON public.alerta_temprana (lower(nivel_riesgo), creado_en DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_alerta_estudiante_fecha_id
    ON public.alerta_temprana (estudiante_id, creado_en DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_alerta_senal_trgm
    ON public.alerta_temprana USING gin (lower(senal) gin_trgm_ops);

-- Cuentas: orden de listados y búsqueda parcial.
CREATE INDEX IF NOT EXISTS idx_usuario_estado_rol
    ON public.usuario (estado, rol, apellidos, nombres, id);
CREATE INDEX IF NOT EXISTS idx_usuario_correo_trgm
    ON public.usuario USING gin (lower(correo) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_usuario_nombres_trgm
    ON public.usuario USING gin (lower(nombres) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_usuario_apellidos_trgm
    ON public.usuario USING gin (lower(apellidos) gin_trgm_ops);

-- Resultados académicos, filtros de evidencia/resultado, y texto consultado.
CREATE INDEX IF NOT EXISTS idx_resultado_verificado_fecha
    ON public.resultado_academico (verificado, fecha_observacion DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_resultado_estado_fecha_id
    ON public.resultado_academico (resultado, fecha_observacion DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_resultado_fuente_trgm
    ON public.resultado_academico USING gin (lower(fuente_evidencia) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_resultado_observaciones_trgm
    ON public.resultado_academico USING gin (lower(observaciones) gin_trgm_ops);

-- Último riesgo por estudiante e historial ordenado de seguimientos.
CREATE INDEX IF NOT EXISTS idx_riesgo_estudiante_id_desc
    ON public.evaluacion_riesgo (estudiante_id, id DESC);
CREATE INDEX IF NOT EXISTS idx_seguimiento_alerta_fecha_id
    ON public.seguimiento_alerta (alerta_id, creado_en DESC, id DESC);
