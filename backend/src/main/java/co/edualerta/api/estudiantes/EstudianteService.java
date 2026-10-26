package co.edualerta.api.estudiantes;

import co.edualerta.api.riesgos.EvaluacionRiesgo;
import co.edualerta.api.riesgos.EvaluacionRiesgoRepository;
import co.edualerta.api.riesgos.EvaluacionRiesgoResponse;
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
import java.util.Objects;

/** Reglas de negocio del CRUD de estudiantes y sus indicadores asociados. */
@Service
@Transactional
public class EstudianteService {
    private final EstudianteRepository estudianteRepository;
    private final UsuarioRepository usuarioRepository;
    private final EvaluacionRiesgoRepository riesgoRepository;

    public EstudianteService(
            EstudianteRepository estudianteRepository,
            UsuarioRepository usuarioRepository,
            EvaluacionRiesgoRepository riesgoRepository
    ) {
        this.estudianteRepository = estudianteRepository;
        this.usuarioRepository = usuarioRepository;
        this.riesgoRepository = riesgoRepository;
    }

    @Transactional(readOnly = true)
    public Page<EstudianteResponse> listar(
            String texto, String estado, String nivelRiesgo, String grado,
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

        if (filtroEstado != null && !List.of("activo", "inactivo", "egresado", "retirado").contains(filtroEstado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El filtro de estado no es válido");
        }
        if (filtroRiesgo != null && !List.of("bajo", "medio", "alto", "sin_evaluar").contains(filtroRiesgo)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El filtro de riesgo no es válido");
        }
        if (filtroGrado != null && filtroGrado.length() > 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El filtro de grado no puede superar 10 caracteres");
        }

        Pageable pageable = PageRequest.of(pagina, tamano);
        // Las cadenas vacías representan filtros opcionales no informados en la consulta JPQL.
        return estudianteRepository.buscarPaginado(
                filtroTexto == null ? "" : filtroTexto,
                filtroEstado == null ? "" : filtroEstado,
                filtroRiesgo == null ? "" : filtroRiesgo,
                filtroGrado == null ? "" : filtroGrado,
                pageable
        );
    }

    private String normalizarFiltro(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim().toLowerCase(Locale.ROOT);
    }

    @Transactional(readOnly = true)
    public EstudianteResponse buscarPorId(Long id) {
        return convertirRespuesta(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public List<EvaluacionRiesgoResponse> historialRiesgo(Long id) {
        // La existencia de la ficha se valida incluso cuando todavía no tiene evaluaciones.
        obtenerEntidad(id);
        return riesgoRepository.findByEstudiante_IdOrderByCreadoEnDescIdDesc(id)
                .stream().map(EvaluacionRiesgoResponse::desde).toList();
    }

    public EstudianteResponse crear(EstudianteRequest request) {
        String codigo = normalizarCodigo(request.codigoEstudiantil());
        validarCodigoUnico(codigo, null);

        Estudiante estudiante = new Estudiante();
        aplicarDatos(estudiante, request, codigo, true);
        estudiante = estudianteRepository.save(estudiante);
        guardarEvaluacionRiesgoSiFueInformada(estudiante, request);
        return convertirRespuesta(estudiante);
    }

    public EstudianteResponse actualizar(Long id, EstudianteRequest request) {
        Estudiante estudiante = obtenerEntidad(id);
        String codigo = normalizarCodigo(request.codigoEstudiantil());
        validarCodigoUnico(codigo, id);

        aplicarDatos(estudiante, request, codigo, false);
        estudiante = estudianteRepository.save(estudiante);
        guardarEvaluacionRiesgoSiFueInformada(estudiante, request);
        return convertirRespuesta(estudiante);
    }

    /** Baja lógica para conservar la ficha y sus alertas e historial. */
    public void desactivar(Long id) {
        Estudiante estudiante = obtenerEntidad(id);
        estudiante.setEstado("inactivo");
        estudianteRepository.save(estudiante);
    }

    private Estudiante obtenerEntidad(Long id) {
        return estudianteRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No se encontró el estudiante solicitado"));
    }

    private void validarCodigoUnico(String codigo, Long idActual) {
        boolean duplicado = idActual == null
                ? estudianteRepository.existsByCodigoEstudiantilIgnoreCase(codigo)
                : estudianteRepository.existsByCodigoEstudiantilIgnoreCaseAndIdNot(codigo, idActual);
        if (duplicado) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe un estudiante con ese código estudiantil");
        }
    }

    private void aplicarDatos(
            Estudiante estudiante, EstudianteRequest request, String codigo, boolean esNuevo
    ) {
        estudiante.setCodigoEstudiantil(codigo);
        estudiante.setNombres(request.nombres().trim());
        estudiante.setApellidos(request.apellidos().trim());
        estudiante.setEstado(request.estado().trim().toLowerCase(Locale.ROOT));

        if (request.grado() != null) {
            estudiante.setGrado(request.grado().isBlank() ? null : request.grado().trim());
        }
        // Null significa “no modificar” para que clientes antiguos no borren el promedio.
        if (request.promedioActual() != null) {
            estudiante.setPromedioActual(request.promedioActual());
        }

        // En actualizaciones, null no debe desvincular accidentalmente una cuenta existente.
        if (request.usuarioId() != null) {
            Usuario usuario = usuarioRepository.findById(request.usuarioId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST, "El usuario vinculado no existe"));
            estudiante.setUsuario(usuario);
        } else if (esNuevo) {
            estudiante.setUsuario(null);
        }
    }

    /** Cada nivel informado genera historial; no se presenta como una predicción automática. */
    private void guardarEvaluacionRiesgoSiFueInformada(Estudiante estudiante, EstudianteRequest request) {
        if (request.nivelRiesgo() == null || request.nivelRiesgo().isBlank()) return;

        String nivelSolicitado = request.nivelRiesgo().trim().toLowerCase(Locale.ROOT);
        String observacionSolicitada = request.observacionesRiesgo() == null
                ? null : request.observacionesRiesgo().trim();
        EvaluacionRiesgo anterior = riesgoRepository
                .findFirstByEstudiante_IdOrderByCreadoEnDescIdDesc(estudiante.getId())
                .orElse(null);

        // No crear una evaluación nueva solo porque cambió el nombre u otro dato de la ficha.
        if (anterior != null
                && anterior.getNivel().equalsIgnoreCase(nivelSolicitado)
                && Objects.equals(anterior.getObservaciones(), observacionSolicitada)) {
            return;
        }
        // Si nunca ha sido evaluado y el formulario sigue en “sin evaluar”, no se crea un falso evento.
        if (anterior == null && "sin_evaluar".equals(nivelSolicitado)
                && (observacionSolicitada == null || observacionSolicitada.isBlank())) {
            return;
        }

        EvaluacionRiesgo evaluacion = new EvaluacionRiesgo();
        evaluacion.setEstudiante(estudiante);
        evaluacion.setNivel(nivelSolicitado);
        evaluacion.setObservaciones(observacionSolicitada);
        evaluacion.setFuente("MANUAL");
        riesgoRepository.save(evaluacion);
    }

    private EstudianteResponse convertirRespuesta(Estudiante estudiante) {
        EvaluacionRiesgo riesgo = riesgoRepository
                .findFirstByEstudiante_IdOrderByCreadoEnDescIdDesc(estudiante.getId())
                .orElse(null);
        return new EstudianteResponse(
                estudiante.getId(),
                estudiante.getUsuario() == null ? null : estudiante.getUsuario().getId(),
                estudiante.getCodigoEstudiantil(),
                estudiante.getNombres(),
                estudiante.getApellidos(),
                estudiante.getEstado(),
                estudiante.getGrado(),
                estudiante.getPromedioActual(),
                riesgo == null ? "sin_evaluar" : riesgo.getNivel(),
                riesgo == null ? null : riesgo.getObservaciones(),
                estudiante.getCreadoEn(),
                estudiante.getActualizadoEn()
        );
    }

    private String normalizarCodigo(String codigo) {
        return codigo.trim().toUpperCase(Locale.ROOT);
    }
}



