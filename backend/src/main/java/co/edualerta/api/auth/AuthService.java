package co.edualerta.api.auth;

import co.edualerta.api.usuarios.Usuario;
import co.edualerta.api.usuarios.UsuarioResponse;
import co.edualerta.api.usuarios.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** Valida credenciales y entrega tokens de acceso de duración limitada. */
@Service
public class AuthService {

    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioService usuarioService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.usuarioService = usuarioService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public LoginResponse iniciarSesion(LoginRequest request) {
        Usuario usuario;
        try {
            usuario = usuarioService.buscarPorCorreo(request.correo());
        } catch (ResponseStatusException exception) {
            // No revela si el correo existe: respuesta idéntica a una contraseña incorrecta.
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos"
            );
        }

        if (!"activo".equalsIgnoreCase(usuario.getEstado())
                || !passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos"
            );
        }

        String token = jwtService.generarToken(usuario);
        UsuarioResponse perfil = usuarioService.buscarPerfil(usuario.getCorreo());
        return new LoginResponse(token, "Bearer", jwtService.getTtlSeconds(), perfil);
    }

    public UsuarioResponse obtenerPerfil(String correoAutenticado) {
        return usuarioService.buscarPerfil(correoAutenticado);
    }
}
