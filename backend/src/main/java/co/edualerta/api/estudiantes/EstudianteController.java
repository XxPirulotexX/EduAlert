package co.edualerta.api.estudiantes;

import co.edualerta.api.riesgos.EvaluacionRiesgoResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

/** Endpoints REST paginados para las fichas de estudiantes y su historial. */
@RestController
@RequestMapping("/api/estudiantes")
public class EstudianteController {

    private final EstudianteService estudianteService;

    public EstudianteController(EstudianteService estudianteService) {
        this.estudianteService = estudianteService;
    }

    @GetMapping
    public Page<EstudianteResponse> listar(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String nivelRiesgo,
            @RequestParam(required = false) String grado,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano
    ) {
        return estudianteService.listar(texto, estado, nivelRiesgo, grado, pagina, tamano);
    }

    @GetMapping("/{id}")
    public EstudianteResponse buscarPorId(@PathVariable Long id) {
        return estudianteService.buscarPorId(id);
    }

    @GetMapping("/{id}/riesgo/historial")
    public List<EvaluacionRiesgoResponse> historialRiesgo(@PathVariable Long id) {
        return estudianteService.historialRiesgo(id);
    }

    @PostMapping
    public ResponseEntity<EstudianteResponse> crear(@Valid @RequestBody EstudianteRequest request) {
        EstudianteResponse creado = estudianteService.crear(request);
        return ResponseEntity.created(URI.create("/api/estudiantes/" + creado.id())).body(creado);
    }

    @PutMapping("/{id}")
    public EstudianteResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EstudianteRequest request
    ) {
        return estudianteService.actualizar(id, request);
    }

    /** Baja lógica para conservar el historial y evitar inconsistencias referenciales. */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        estudianteService.desactivar(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
