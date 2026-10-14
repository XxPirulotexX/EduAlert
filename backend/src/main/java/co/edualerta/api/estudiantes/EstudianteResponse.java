package co.edualerta.api.estudiantes;

import java.math.BigDecimal;
import java.time.Instant;

/** DTO de salida: expone ficha e indicador de riesgo vigente sin exponer entidades JPA. */
public record EstudianteResponse(
        Long id,
        Long usuarioId,
        String codigoEstudiantil,
        String nombres,
        String apellidos,
        String estado,
        String grado,
        BigDecimal promedioActual,
        String nivelRiesgo,
        String observacionesRiesgo,
        Instant creadoEn,
        Instant actualizadoEn
) {
}
