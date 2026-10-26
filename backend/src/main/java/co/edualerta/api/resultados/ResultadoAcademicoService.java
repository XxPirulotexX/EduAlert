package co.edualerta.api.resultados;

import co.edualerta.api.estudiantes.Estudiante;
import co.edualerta.api.estudiantes.EstudianteRepository;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

/** Reglas de negocio y consultas paginadas de resultados académicos observados. */
@Service
@Transactional
public class ResultadoAcademicoService {

    private static final List<String> RESULTADOS_PERMITIDOS =
            List.of("CONTINUIDAD", "DESERCION", "DESCONOCIDO");

    private final ResultadoAcademicoRepository resultadoRepository;
    private final EstudianteRepository estudianteRepository;

    public ResultadoAcademicoService(
            ResultadoAcademicoRepository resultadoRepository,
            EstudianteRepository estudianteRepository
    ) {
        this.resultadoRepository = resultadoRepository;
        this.estudianteRepository = estudianteRepository;
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<ResultadoAcademicoResponse> listar(
            String texto,
            String resultado,
            Long estudianteId,
            Boolean verificado,
            int pagina,
            int tamano
    ) {
        Pageable pageable = crearPaginacion(pagina, tamano);
        if (estudianteId != null && !estudianteRepository.existsById(estudianteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No se encontró el estudiante solicitado.");
        }

        String filtroTexto = normalizarTextoFiltro(texto);
        String filtroResultado = normalizarResultadoFiltro(resultado);
        // Los filtros String no informados se envían como cadenas vacías para evitar
        // parámetros nulos sin tipo en las condiciones JPQL de PostgreSQL.
        return resultadoRepository.buscarPaginado(
                filtroTexto == null ? "" : filtroTexto,
                filtroResultado == null ? "" : filtroResultado,
                estudianteId,
                verificado,
                pageable
        ).map(this::convertirRespuesta);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<ResultadoAcademicoResponse> listarPorEstudiante(
            Long estudianteId, int pagina, int tamano
    ) {
        if (estudianteId == null || !estudianteRepository.existsById(estudianteId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "No se encontró el estudiante solicitado.");
        }
        return resultadoRepository.buscarPorEstudiante(estudianteId, crearPaginacion(pagina, tamano))
                .map(this::convertirRespuesta);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public Page<ResultadoAcademicoResponse> listarResultadosVerificados(int pagina, int tamano) {
        return resultadoRepository.buscarVerificados(crearPaginacion(pagina, tamano))
                .map(this::convertirRespuesta);
    }

    @Transactional(Transactional.TxType.SUPPORTS)
    public ResultadoAcademicoResponse obtenerPorId(Long id) {
        return convertirRespuesta(buscarEntidad(id));
    }

    public ResultadoAcademicoResponse registrar(ResultadoAcademicoRequest request) {
        Estudiante estudiante = estudianteRepository.findById(request.estudianteId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No se encontró el estudiante solicitado."));

        String resultado = normalizarResultadoRequerido(request.resultado());
        String fuente = normalizarFuente(request.fuenteEvidencia());
        validarEvidencia(resultado, request.fechaObservacion(), fuente);

        ResultadoAcademico entidad = new ResultadoAcademico();
        entidad.setEstudiante(estudiante);
        entidad.setResultado(resultado);
        entidad.setFechaObservacion(request.fechaObservacion());
        entidad.setFuenteEvidencia(fuente);
        entidad.setObservaciones(normalizarObservaciones(request.observaciones()));
        // El esquema marca como definitivos los resultados con fecha y fuente declaradas.
        // La fuente declarada no demuestra por sí sola su calidad: requiere revisión humana.
        entidad.setVerificado(esDefinitivo(resultado));
        return convertirRespuesta(resultadoRepository.save(entidad));
    }

    public ResultadoAcademicoResponse actualizar(Long id, ResultadoAcademicoRequest request) {
        ResultadoAcademico entidad = buscarEntidad(id);
        Estudiante estudiante = estudianteRepository.findById(request.estudianteId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No se encontró el estudiante solicitado."));

        String resultado = normalizarResultadoRequerido(request.resultado());
        String fuente = normalizarFuente(request.fuenteEvidencia());
        validarEvidencia(resultado, request.fechaObservacion(), fuente);

        entidad.setEstudiante(estudiante);
        entidad.setResultado(resultado);
        entidad.setFechaObservacion(request.fechaObservacion());
        entidad.setFuenteEvidencia(fuente);
        entidad.setObservaciones(normalizarObservaciones(request.observaciones()));
        entidad.setVerificado(esDefinitivo(resultado));
        return convertirRespuesta(resultadoRepository.save(entidad));
    }

    public void eliminar(Long id) {
        ResultadoAcademico entidad = buscarEntidad(id);
        resultadoRepository.delete(entidad);
    }

    private Pageable crearPaginacion(int pagina, int tamano) {
        if (pagina < 0 || tamano < 1 || tamano > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La página debe ser mayor o igual a cero y el tamaño debe estar entre 1 y 100.");
        }
        Sort orden = Sort.by(Sort.Order.desc("fechaObservacion").nullsLast())
                .and(Sort.by(Sort.Direction.DESC, "id"));
        return PageRequest.of(pagina, tamano, orden);
    }

    private String normalizarTextoFiltro(String texto) {
        if (texto == null || texto.isBlank()) return null;
        String normalizado = texto.trim().toLowerCase(Locale.ROOT);
        if (normalizado.length() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La búsqueda no puede superar 100 caracteres.");
        }
        return normalizado;
    }

    private String normalizarResultadoFiltro(String resultado) {
        if (resultado == null || resultado.isBlank()) return null;
        String normalizado = resultado.trim().toUpperCase(Locale.ROOT);
        if (!RESULTADOS_PERMITIDOS.contains(normalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "El filtro debe ser CONTINUIDAD, DESERCION o DESCONOCIDO.");
        }
        return normalizado;
    }

    private String normalizarResultadoRequerido(String resultado) {
        if (resultado == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El resultado es obligatorio.");
        }
        String normalizado = resultado.trim().toUpperCase(Locale.ROOT);
        if (!RESULTADOS_PERMITIDOS.contains(normalizado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El resultado informado no es válido.");
        }
        return normalizado;
    }

    private String normalizarFuente(String fuente) {
        if (fuente == null || fuente.isBlank()) return null;
        String normalizada = fuente.trim();
        if (normalizada.length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fuente de evidencia no puede superar 150 caracteres.");
        }
        return normalizada;
    }

    private String normalizarObservaciones(String observaciones) {
        if (observaciones == null || observaciones.isBlank()) return null;
        String normalizadas = observaciones.trim();
        if (normalizadas.length() > 4000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Las observaciones no pueden superar 4000 caracteres.");
        }
        return normalizadas;
    }

    private boolean esDefinitivo(String resultado) {
        return "CONTINUIDAD".equals(resultado) || "DESERCION".equals(resultado);
    }

    private void validarEvidencia(String resultado, LocalDate fecha, String fuente) {
        if (!esDefinitivo(resultado)) return;
        if (fecha == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de observación es obligatoria para un resultado definitivo.");
        }
        if (fecha.isAfter(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fecha de observación no puede ser futura.");
        }
        if (fuente == null || fuente.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La fuente de evidencia es obligatoria para un resultado definitivo.");
        }
    }

    private ResultadoAcademico buscarEntidad(Long id) {
        return resultadoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "No se encontró el resultado académico solicitado."));
    }

    private ResultadoAcademicoResponse convertirRespuesta(ResultadoAcademico entidad) {
        Estudiante estudiante = entidad.getEstudiante();
        return new ResultadoAcademicoResponse(
                entidad.getId(),
                estudiante.getId(),
                estudiante.getCodigoEstudiantil(),
                estudiante.getNombres(),
                estudiante.getApellidos(),
                entidad.getResultado(),
                entidad.getFechaObservacion(),
                entidad.getFuenteEvidencia(),
                entidad.getObservaciones(),
                entidad.isVerificado(),
                entidad.getCreadoEn(),
                entidad.getActualizadoEn()
        );
    }
}
