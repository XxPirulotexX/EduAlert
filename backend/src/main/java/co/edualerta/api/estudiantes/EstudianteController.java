package co.edualerta.api.estudiantes;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import co.edualerta.api.riesgos.EvaluacionRiesgoResponse;

import java.net.URI;
import java.util.List;

/** Endpoints REST CRUD para la primera entidad conectada a PostgreSQL. */
@RestController
@RequestMapping("/api/estudiantes")
public class EstudianteController {

    private final EstudianteService estudianteService;

    public EstudianteController(EstudianteService estudianteService) {
        this.estudianteService = estudianteService;
    }

    @GetMapping
    public List<EstudianteResponse> listar() {
        return estudianteService.listar();
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivar(@PathVariable Long id) {
        estudianteService.desactivar(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
