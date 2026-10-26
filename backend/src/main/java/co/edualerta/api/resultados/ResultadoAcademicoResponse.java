package co.edualerta.api.resultados;

import java.time.Instant;
import java.time.LocalDate;

/** Datos de salida de un resultado académico. */
public record ResultadoAcademicoResponse(
        Long id,
        Long estudianteId,
        String codigoEstudiantil,
        String nombres,
        String apellidos,
        String resultado,
        LocalDate fechaObservacion,
        String fuenteEvidencia,
        String observaciones,
        boolean verificado,
        Instant creadoEn,
        Instant actualizadoEn
) {
}