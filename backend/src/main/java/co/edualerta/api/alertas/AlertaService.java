package co.edualerta.api.alertas;

import co.edualerta.api.estudiantes.Estudiante;
import co.edualerta.api.estudiantes.EstudianteRepository;
import co.edualerta.api.riesgos.EvaluacionRiesgo;
import co.edualerta.api.riesgos.EvaluacionRiesgoRepository;
import co.edualerta.api.usuarios.Usuario;
import co.edualerta.api.usuarios.UsuarioRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;

/** Reglas de negocio para alertas y su historial de seguimiento persistido en PostgreSQL. */
@Service
@Transactional
public class AlertaService {
    private final AlertaRepository alertaRepository;
    private final EstudianteRepository estudianteRepository;
    private final EvaluacionRiesgoRepository riesgoRepository;
    private final SeguimientoAlertaRepository seguimientoRepository;
    private final UsuarioRepository usuarioRepository;

    public AlertaService(
            AlertaRepository alertaRepository,
            EstudianteRepository estudianteRepository,
            EvaluacionRiesgoRepository riesgoRepository,
            SeguimientoAlertaRepository seguimientoRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.alertaRepository = alertaRepository;
        this.estudianteRepository = estudianteRepository;
        this.riesgoRepository = riesgoRepository;
        this.seguimientoRepository = seguimientoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional(readOnly = true)
    public Page<AlertaResponse> listar(
            String texto, String estado, String nivelRiesgo, String grado, Long estudianteId,
            int pagina, int tamano
    ) {
        if (pagina < 0 || tamano < 1 || tamano > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "La página debe ser mayor o igual a cero y el tamaño debe estar entre 1 y 100"
            );
        }

        String filtroTexto = normalizarFiltro(texto);
        String filtroEstado = normalizarFiltro(estado);
        String filtroRiesgo = normalizarFiltro(nivelRiesgo);
        String filtroGrado = normalizarFiltro(grado);

        if (filtroEstado != null && !List.of("nueva", "en seguimiento", "revisada", "archivada").contains(filtroEstado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El filtro de estado no es válido");
        }
        if (filtroRiesgo != null && !List.of("bajo", "medio", "alto", "sin_evaluar").contains(filtroRiesgo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El filtro de riesgo no es válido");
        }
        if (filtroGrado != null && !"__otros__".equals(filtroGrado) && filtroGrado.length() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El filtro de grado no puede superar 10 caracteres");
        }

        if (estudianteId != null && !estudianteRepository.existsById(estudianteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No se encontró la ficha del estudiante");
        }

        Pageable pageable = PageRequest.of(pagina, tamano);
        // La consulta JPQL recibe cadenas vacías para los filtros de texto no informados.
        // Así Hibernate no infiere un tipo binario para parámetros String nulos en PostgreSQL.
        return alertaRepository.buscarPaginado(
                filtroTexto == null ? "" : filtroTexto,
                filtroEstado == null ? "" : filtroEstado,
                filtroRiesgo == null ? "" : filtroRiesgo,
                filtroGrado == null ? "" : filtroGrado,
                estudianteId,
                pageable
        ).map(AlertaResponse::desde);
    }

    private String normalizarFiltro(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public AlertaResponse buscarPorId(Long id) {
        return AlertaResponse.desde(obtenerAlerta(id));
    }

    public AlertaResponse crear(AlertaRequest request) {
        Estudiante estudiante = estudianteRepository.findById(request.estudianteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró la ficha del estudiante"));
        if (!"activo".equalsIgnoreCase(estudiante.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se pueden crear alertas para estudiantes activos");
        }

        String nivel = request.nivelRiesgo();
        if (nivel == null || nivel.isBlank()) {
            nivel = riesgoRepository.findFirstByEstudiante_IdOrderByCreadoEnDescIdDesc(estudiante.getId())
                    .map(riesgo -> riesgo.getNivel()).orElse("sin_evaluar");
        }

        AlertaTemprana alerta = new AlertaTemprana();
        alerta.setEstudiante(estudiante);
        alerta.setSenal(request.senal());
        alerta.setNivelRiesgo(nivel.toLowerCase(Locale.ROOT));
        alerta.setEstado("Nueva");
        return AlertaResponse.desde(alertaRepository.save(alerta));
    }

    public AlertaResponse actualizar(Long id, AlertaRequest request) {
        AlertaTemprana alerta = obtenerAlertaEditable(id);
        Estudiante estudiante = estudianteRepository.findById(request.estudianteId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró la ficha del estudiante"));
        if (!"activo".equalsIgnoreCase(estudiante.getEstado())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Solo se pueden asociar alertas a estudiantes activos");
        }

        String nivel = request.nivelRiesgo();
        if (nivel == null || nivel.isBlank()) {
            nivel = riesgoRepository.findFirstByEstudiante_IdOrderByCreadoEnDescIdDesc(estudiante.getId())
                    .map(EvaluacionRiesgo::getNivel).orElse("sin_evaluar");
        }
        alerta.setEstudiante(estudiante);
        alerta.setSenal(request.senal().trim());
        alerta.setNivelRiesgo(nivel.toLowerCase(Locale.ROOT));
        return AlertaResponse.desde(alertaRepository.save(alerta));
    }

    public AlertaResponse actualizarEstado(Long id, ActualizarEstadoAlertaRequest request) {
        AlertaTemprana alerta = obtenerAlertaEditable(id);
        alerta.setEstado(request.estado());
        return AlertaResponse.desde(alertaRepository.save(alerta));
    }

    /** Archiva en lugar de borrar físicamente para conservar evidencia y seguimientos. */
    public void archivar(Long id) {
        AlertaTemprana alerta = obtenerAlerta(id);
        if (!"Archivada".equalsIgnoreCase(alerta.getEstado())) {
            alerta.setEstado("Archivada");
            alertaRepository.save(alerta);
        }
    }

    private AlertaTemprana obtenerAlertaEditable(Long id) {
        AlertaTemprana alerta = obtenerAlerta(id);
        if ("Archivada".equalsIgnoreCase(alerta.getEstado())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La alerta está archivada y no admite cambios");
        }
        return alerta;
    }

    @Transactional(readOnly = true)
    public List<SeguimientoAlertaResponse> listarSeguimientos(Long alertaId) {
        obtenerAlerta(alertaId);
        return seguimientoRepository.findByAlerta_IdOrderByCreadoEnDescIdDesc(alertaId)
                .stream().map(SeguimientoAlertaResponse::desde).toList();
    }

    public SeguimientoAlertaResponse agregarSeguimiento(
            Long alertaId, SeguimientoAlertaRequest request, String correoResponsable
    ) {
        AlertaTemprana alerta = obtenerAlertaEditable(alertaId);
        Usuario responsable = usuarioRepository.findByCorreoIgnoreCase(correoResponsable)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                        "No se encontró la cuenta autenticada"));

        SeguimientoAlerta seguimiento = new SeguimientoAlerta();
        seguimiento.setAlerta(alerta);
        seguimiento.setResponsable(responsable);
        seguimiento.setObservaciones(request.observaciones());
        return SeguimientoAlertaResponse.desde(seguimientoRepository.save(seguimiento));
    }

    private AlertaTemprana obtenerAlerta(Long id) {
        return alertaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No se encontró la alerta solicitada"));
    }
}



