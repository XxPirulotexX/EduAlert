package co.edualerta.api.usuarios;

import co.edualerta.api.estudiantes.Estudiante;
import co.edualerta.api.estudiantes.EstudianteRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

/** Reglas de negocio para crear cuentas y vincular estudiantes de forma controlada. */
@Service
@Transactional
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final EstudianteRepository estudianteRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            EstudianteRepository estudianteRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.usuarioRepository = usuarioRepository;
        this.estudianteRepository = estudianteRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public Usuario buscarPorCorreo(String correo) {
        return usuarioRepository.findByCorreoIgnoreCase(correo.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos"
                ));
    }

    @Transactional(readOnly = true)
    public UsuarioResponse buscarPerfil(String correo) {
        Usuario usuario = buscarPorCorreo(correo);
        return convertirRespuesta(usuario);
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll(Sort.by("apellidos", "nombres"))
                .stream()
                .map(this::convertirRespuesta)
                .toList();
    }

    public UsuarioResponse crear(UsuarioRequest request) {
        String correo = request.correo().trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByCorreoIgnoreCase(correo)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Ya existe una cuenta con ese correo"
            );
        }

        String rol = request.rol().trim().toUpperCase(Locale.ROOT);
        boolean rolEstudiante = rol.equals("ESTUDIANTE");

        if (rolEstudiante && request.estudianteId() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Para crear una cuenta estudiante debes vincular una ficha de estudiante"
            );
        }
        if (!rolEstudiante && request.estudianteId() != null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Solo una cuenta con rol estudiante puede vincularse a una ficha"
            );
        }

        Estudiante estudiante = null;
        if (request.estudianteId() != null) {
            estudiante = estudianteRepository.findById(request.estudianteId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "No se encontró la ficha de estudiante"
                    ));

            if (estudiante.getUsuario() != null) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "La ficha seleccionada ya está vinculada a una cuenta"
                );
            }
            if (!"activo".equalsIgnoreCase(estudiante.getEstado())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Solo se puede vincular una ficha de estudiante activa"
                );
            }
        }

        Usuario usuario = new Usuario();
        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());
        usuario.setCorreo(correo);
        // Nunca se almacena la contraseña original.
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(rol);
        usuario.setEstado("activo");

        usuario = usuarioRepository.save(usuario);

        // La relación se persiste desde el lado propietario: Estudiante.usuario.
        if (estudiante != null) {
            estudiante.setUsuario(usuario);
            estudianteRepository.save(estudiante);
        }

        return UsuarioResponse.desde(usuario, estudiante == null ? null : estudiante.getId());
    }

    private UsuarioResponse convertirRespuesta(Usuario usuario) {
        Long estudianteId = estudianteRepository.findByUsuario_Id(usuario.getId())
                .map(Estudiante::getId)
                .orElse(null);
        return UsuarioResponse.desde(usuario, estudianteId);
    }
}
