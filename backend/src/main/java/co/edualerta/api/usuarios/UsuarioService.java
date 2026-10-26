package co.edualerta.api.usuarios;

import co.edualerta.api.estudiantes.Estudiante;
import co.edualerta.api.estudiantes.EstudianteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
    public Page<UsuarioResponse> listar(String texto, int pagina, int tamano) {
        if (pagina < 0 || tamano < 1 || tamano > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La página debe ser mayor o igual a cero y el tamaño debe estar entre 1 y 100");
        }
        String filtro = texto == null || texto.isBlank()
                ? null : texto.trim().toLowerCase(Locale.ROOT);
        Pageable pageable = PageRequest.of(pagina, tamano);
        return usuarioRepository.buscarPaginado(filtro == null ? "" : filtro, pageable);
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

    /** Actualiza la cuenta y su vínculo opcional con la ficha, dentro de una sola transacción. */
    public UsuarioResponse actualizar(Long id, ActualizarUsuarioRequest request, String correoAutenticado) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró la cuenta solicitada."));

        String correo = request.correo().trim().toLowerCase(Locale.ROOT);
        String rol = request.rol().trim().toUpperCase(Locale.ROOT);
        String estado = request.estado().trim().toLowerCase(Locale.ROOT);
        boolean esMismaCuenta = usuario.getCorreo().equalsIgnoreCase(correoAutenticado);
        if (esMismaCuenta && (!usuario.getCorreo().equalsIgnoreCase(correo)
                || !usuario.getRol().equalsIgnoreCase(rol)
                || (!"activo".equals(estado)))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No puedes cambiar el correo, rol o estado de tu propia sesión administrativa.");
        }
        if (usuarioRepository.existsByCorreoIgnoreCaseAndIdNot(correo, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe otra cuenta con ese correo.");
        }

        Estudiante vinculadoActual = estudianteRepository.findByUsuario_Id(id).orElse(null);
        Estudiante vinculadoSolicitado = null;
        if ("ESTUDIANTE".equals(rol)) {
            Long studentId = request.estudianteId();
            if (studentId == null && vinculadoActual != null) {
                studentId = vinculadoActual.getId();
            }
            if (studentId == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Una cuenta con rol estudiante debe estar vinculada a una ficha.");
            }
            final Long selectedStudentId = studentId;
            vinculadoSolicitado = estudianteRepository.findById(selectedStudentId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "No se encontró la ficha de estudiante."));
            if (!"activo".equalsIgnoreCase(vinculadoSolicitado.getEstado())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Solo se puede vincular una ficha activa.");
            }
            if (vinculadoSolicitado.getUsuario() != null
                    && !vinculadoSolicitado.getUsuario().getId().equals(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "La ficha seleccionada ya está vinculada a otra cuenta.");
            }
        } else if (request.estudianteId() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo una cuenta con rol estudiante puede vincular una ficha.");
        }

        usuario.setNombres(request.nombres().trim());
        usuario.setApellidos(request.apellidos().trim());
        usuario.setCorreo(correo);
        usuario.setRol(rol);
        usuario.setEstado(estado);
        usuario = usuarioRepository.save(usuario);

        if (vinculadoActual != null && (vinculadoSolicitado == null
                || !vinculadoActual.getId().equals(vinculadoSolicitado.getId()))) {
            vinculadoActual.setUsuario(null);
            estudianteRepository.save(vinculadoActual);
        }
        if (vinculadoSolicitado != null) {
            vinculadoSolicitado.setUsuario(usuario);
            estudianteRepository.save(vinculadoSolicitado);
        }

        return UsuarioResponse.desde(usuario,
                vinculadoSolicitado == null ? null : vinculadoSolicitado.getId());
    }

    /** Desactivación lógica para impedir el login sin destruir relaciones e historial. */
    public void desactivar(Long id, String correoAutenticado) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró la cuenta solicitada."));
        if (usuario.getCorreo().equalsIgnoreCase(correoAutenticado)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "No puedes desactivar la cuenta con la que estás autenticado.");
        }
        if (!"inactivo".equalsIgnoreCase(usuario.getEstado())) {
            usuario.setEstado("inactivo");
            usuarioRepository.save(usuario);
        }
    }

    private UsuarioResponse convertirRespuesta(Usuario usuario) {
        Long estudianteId = estudianteRepository.findByUsuario_Id(usuario.getId())
                .map(Estudiante::getId)
                .orElse(null);
        return UsuarioResponse.desde(usuario, estudianteId);
    }
}



