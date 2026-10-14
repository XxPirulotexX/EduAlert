package co.edualerta.api.alertas;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/** Estados permitidos para el seguimiento de una alerta. */
public record ActualizarEstadoAlertaRequest(
        @NotBlank(message = "El estado es obligatorio")
        @Pattern(regexp = "Nueva|En seguimiento|Revisada", message = "Estado no válido")
        String estado
) {
}
