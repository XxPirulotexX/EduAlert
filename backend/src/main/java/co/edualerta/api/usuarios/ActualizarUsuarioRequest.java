package co.edualerta.api.usuarios;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Campos editables de una cuenta; las contraseñas se gestionan por un flujo separado. */
public record ActualizarUsuarioRequest(
        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 100, message = "Los nombres no pueden superar 100 caracteres")
        String nombres,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden superar 100 caracteres")
        String apellidos,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Escribe un correo válido")
        @Size(max = 254, message = "El correo no puede superar 254 caracteres")
        String correo,

        @NotBlank(message = "El rol es obligatorio")
        @Pattern(regexp = "(?i)administrador|docente|orientador|estudiante", message = "El rol no es válido")
        String rol,

        @NotBlank(message = "El estado es obligatorio")
        @Pattern(regexp = "(?i)activo|inactivo", message = "El estado debe ser activo o inactivo")
        String estado,

        Long estudianteId
) {
}
