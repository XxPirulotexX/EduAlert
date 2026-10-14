package co.edualerta.api.usuarios;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Entrada para que un administrador cree una cuenta sin exponer su hash. */
public record UsuarioRequest(
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

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 10, max = 72, message = "La contraseña debe tener entre 10 y 72 caracteres")
        String password,

        @NotBlank(message = "El rol es obligatorio")
        @Pattern(
                regexp = "(?i)administrador|docente|orientador|estudiante",
                message = "El rol debe ser administrador, docente, orientador o estudiante"
        )
        String rol,

        Long estudianteId
) {
}
