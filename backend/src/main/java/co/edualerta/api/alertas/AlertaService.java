package co.edualerta.api.alertas;

import co.edualerta.api.estudiantes.Estudiante;
import co.edualerta.api.estudiantes.EstudianteRepository;
import co.edualerta.api.riesgos.EvaluacionRiesgoRepository;
import co.edualerta.api.usuarios.Usuario;
import co.edualerta.api.usuarios.UsuarioRepository;
import org.springframework.data.domain.Sort;
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
    public List<AlertaResponse> listar() {
        return alertaRepository.findAll(Sort.by(Sort.Direction.DESC, "creadoEn"))
                .stream().map(AlertaResponse::desde).toList();
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

    public AlertaResponse actualizarEstado(Long id, ActualizarEstadoAlertaRequest request) {
        AlertaTemprana alerta = obtenerAlerta(id);
        alerta.setEstado(request.estado());
        return AlertaResponse.desde(alertaRepository.save(alerta));
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
        AlertaTemprana alerta = obtenerAlerta(alertaId);
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
