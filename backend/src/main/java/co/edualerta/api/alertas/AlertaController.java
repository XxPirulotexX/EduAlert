package co.edualerta.api.alertas;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.List;

/** Endpoints protegidos para crear alertas, cambiar su estado y registrar seguimientos. */
@RestController
@RequestMapping("/api/alertas")
public class AlertaController {
    private final AlertaService alertaService;

    public AlertaController(AlertaService alertaService) {
        this.alertaService = alertaService;
    }

    @GetMapping
    public List<AlertaResponse> listar() {
        return alertaService.listar();
    }

    @PostMapping
    public ResponseEntity<AlertaResponse> crear(@Valid @RequestBody AlertaRequest request) {
        AlertaResponse creada = alertaService.crear(request);
        return ResponseEntity.created(URI.create("/api/alertas/" + creada.id())).body(creada);
    }

    @PatchMapping("/{id}/estado")
    public AlertaResponse actualizarEstado(
            @PathVariable Long id,
            @Valid @RequestBody ActualizarEstadoAlertaRequest request
    ) {
        return alertaService.actualizarEstado(id, request);
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
