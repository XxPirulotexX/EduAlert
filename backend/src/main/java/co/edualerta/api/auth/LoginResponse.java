package co.edualerta.api.auth;

import co.edualerta.api.usuarios.UsuarioResponse;

/** Token temporal y perfil público de la cuenta autenticada. */
public record LoginResponse(
        String accessToken,
        String tokenType,
        long expiresIn,
        UsuarioResponse user
) {
}
