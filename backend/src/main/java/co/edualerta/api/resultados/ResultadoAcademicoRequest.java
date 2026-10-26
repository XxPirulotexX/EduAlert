package co.edualerta.api.resultados;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

/** Datos de entrada para registrar un resultado académico observado. */
public record ResultadoAcademicoRequest(

        @NotNull(message = "El estudiante es obligatorio.")
        Long estudianteId,

        @NotBlank(message = "El resultado es obligatorio.")
        @Pattern(
                regexp = "CONTINUIDAD|DESERCION|DESCONOCIDO",
                message = "El resultado debe ser CONTINUIDAD, DESERCION o DESCONOCIDO."
        )
        String resultado,

        LocalDate fechaObservacion,

        @Size(max = 150, message = "La fuente de evidencia no puede superar 150 caracteres.")
        String fuenteEvidencia,

        @Size(max = 4000, message = "Las observaciones no pueden superar 4000 caracteres.")
        String observaciones
) {
}


