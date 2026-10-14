package co.edualerta.api.estudiantes;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** DTO validado de entrada para crear o actualizar la ficha y sus indicadores actuales. */
public record EstudianteRequest(
        Long usuarioId,

        @NotBlank(message = "El código estudiantil es obligatorio")
        @Size(max = 50, message = "El código no puede superar 50 caracteres")
        String codigoEstudiantil,

        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 100, message = "Los nombres no pueden superar 100 caracteres")
        String nombres,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden superar 100 caracteres")
        String apellidos,

        @NotBlank(message = "El estado es obligatorio")
        @Pattern(regexp = "(?i)activo|inactivo|egresado|retirado", message = "El estado debe ser activo, inactivo, egresado o retirado")
        String estado,

        @Size(max = 10, message = "El grado no puede superar 10 caracteres")
        String grado,

        @DecimalMin(value = "0.0", message = "El promedio mínimo es 0")
        @DecimalMax(value = "5.0", message = "El promedio máximo es 5")
        @Digits(integer = 1, fraction = 2, message = "El promedio admite máximo dos decimales")
        BigDecimal promedioActual,

        @Pattern(regexp = "(?i)bajo|medio|alto|sin_evaluar", message = "El nivel de riesgo debe ser bajo, medio, alto o sin_evaluar")
        String nivelRiesgo,

        @Size(max = 500, message = "Las observaciones de riesgo no pueden superar 500 caracteres")
        String observacionesRiesgo
) {
}
