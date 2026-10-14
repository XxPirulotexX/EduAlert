package co.edualerta.api.alertas;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SeguimientoAlertaRequest(
        @NotBlank(message = "Escribe una observación de seguimiento")
        @Size(max = 1000, message = "La observación no puede superar 1000 caracteres")
        String observaciones
) {
}
