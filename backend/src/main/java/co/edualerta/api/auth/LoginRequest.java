package co.edualerta.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Credenciales recibidas durante el inicio de sesión. */
public record LoginRequest(
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Escribe un correo válido")
        String correo,

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(max = 72, message = "La contraseña supera la longitud permitida")
        String password
) {
}
