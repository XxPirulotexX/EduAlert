package co.edualerta.api.riesgos;

import java.time.Instant;

/** DTO de consulta del historial; distingue registro manual de un modelo predictivo. */
public record EvaluacionRiesgoResponse(
        Long id,
        Long estudianteId,
        String nivel,
        String observaciones,
        String fuente,
        String versionModelo,
        Instant creadoEn
) {
    public static EvaluacionRiesgoResponse desde(EvaluacionRiesgo evaluacion) {
        return new EvaluacionRiesgoResponse(
                evaluacion.getId(), evaluacion.getEstudiante().getId(), evaluacion.getNivel(),
                evaluacion.getObservaciones(), evaluacion.getFuente(),
                evaluacion.getVersionModelo(), evaluacion.getCreadoEn()
        );
    }
}
