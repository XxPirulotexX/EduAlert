package co.edualerta.api.alertas;

import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.List;

/** CRUD REST de alertas y operaciones del historial de seguimiento. */
@RestController
@RequestMapping("/api/alertas")
public class AlertaController {
    private final AlertaService alertaService;

    public AlertaController(AlertaService alertaService) {
        this.alertaService = alertaService;
    }

    @GetMapping
    public Page<AlertaResponse> listar(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String nivelRiesgo,
            @RequestParam(required = false) String grado,
            @RequestParam(required = false) Long estudianteId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano
    ) {
        return alertaService.listar(texto, estado, nivelRiesgo, grado, estudianteId, pagina, tamano);
    }

    @GetMapping("/{id}")
    public AlertaResponse buscarPorId(@PathVariable Long id) {
        return alertaService.buscarPorId(id);
    }

    @PostMapping
    public ResponseEntity<AlertaResponse> crear(@Valid @RequestBody AlertaRequest request) {
        AlertaResponse creada = alertaService.crear(request);
        return ResponseEntity.created(URI.create("/api/alertas/" + creada.id())).body(creada);
    }

    @PutMapping("/{id}")
    public AlertaResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody AlertaRequest request
    ) {
        return alertaService.actualizar(id, request);
    }

    @PatchMapping("/{id}/estado")
    public AlertaResponse actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoAlertaRequest request
    ) {
        return alertaService.actualizarEstado(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> archivar(@PathVariable Long id) {
        alertaService.archivar(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @GetMapping("/{id}/seguimientos")
    public List<SeguimientoAlertaResponse> listarSeguimientos(@PathVariable Long id) {
        return alertaService.listarSeguimientos(id);
    }

    @PostMapping("/{id}/seguimientos")
    public ResponseEntity<SeguimientoAlertaResponse> agregarSeguimiento(
            @PathVariable Long id,
            @Valid @RequestBody SeguimientoAlertaRequest request,
            Principal principal
    ) {
        SeguimientoAlertaResponse creado = alertaService.agregarSeguimiento(id, request, principal.getName());
        return ResponseEntity.created(URI.create("/api/alertas/" + id + "/seguimientos/" + creado.id()))
                .body(creado);
    }
}
