package co.edualerta.api.alertas;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Solicitud para registrar una alerta asociada a un estudiante existente. */
public record AlertaRequest(
        @NotNull(message = "Selecciona un estudiante")
        Long estudianteId,

        @NotBlank(message = "Describe la señal que requiere seguimiento")
        @Size(max = 500, message = "La señal no puede superar 500 caracteres")
        String senal,

        @Pattern(regexp = "(?i)bajo|medio|alto|sin_evaluar", message = "El nivel de riesgo no es válido")
        String nivelRiesgo
) {
}
