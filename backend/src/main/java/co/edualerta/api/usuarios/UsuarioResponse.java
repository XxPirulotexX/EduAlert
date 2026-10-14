package co.edualerta.api.usuarios;

import java.time.Instant;
import java.util.Locale;

/** DTO seguro para devolver datos de cuenta; nunca incluye el hash de la contraseña. */
public record UsuarioResponse(
        Long id,
        String nombres,
        String apellidos,
        String correo,
        String rol,
        String estado,
        Long estudianteId,
        Instant creadoEn
) {
    public static UsuarioResponse desde(Usuario usuario, Long estudianteId) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombres(),
                usuario.getApellidos(),
                usuario.getCorreo(),
                usuario.getRol().toLowerCase(Locale.ROOT),
                usuario.getEstado(),
                estudianteId,
                usuario.getCreadoEn()
        );
    }
}
