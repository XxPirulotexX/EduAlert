package co.edualerta.api.alertas;

import java.time.Instant;

/** Respuesta plana lista para el frontend. */
public record AlertaResponse(
        Long id,
        Long estudianteId,
        String nombreEstudiante,
        String codigoEstudiantil,
        String grado,
        String nivelRiesgo,
        String senal,
        String estado,
        Instant creadoEn,
        Instant actualizadoEn
) {
    public static AlertaResponse desde(AlertaTemprana alerta) {
        var estudiante = alerta.getEstudiante();
        return new AlertaResponse(
                alerta.getId(), estudiante.getId(),
                estudiante.getNombres() + " " + estudiante.getApellidos(),
                estudiante.getCodigoEstudiantil(), estudiante.getGrado(),
                alerta.getNivelRiesgo(), alerta.getSenal(), alerta.getEstado(),
                alerta.getCreadoEn(), alerta.getActualizadoEn()
        );
    }
}
