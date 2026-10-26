package co.edualerta.api.resultados;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.net.URI;

/** Endpoints REST para consultar y registrar resultados académicos. */
@RestController
@RequestMapping("/api/resultados-academicos")
public class ResultadoAcademicoController {

    private final ResultadoAcademicoService resultadoService;

    public ResultadoAcademicoController(ResultadoAcademicoService resultadoService) {
        this.resultadoService = resultadoService;
    }

    @GetMapping("/estudiante/{estudianteId}")
    public Page<ResultadoAcademicoResponse> listarPorEstudiante(
            @PathVariable Long estudianteId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano
    ) {
        return resultadoService.listarPorEstudiante(estudianteId, pagina, tamano);
    }

    @GetMapping("/verificados")
    public Page<ResultadoAcademicoResponse> listarResultadosVerificados(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano
    ) {
        return resultadoService.listarResultadosVerificados(pagina, tamano);
    }

    @PostMapping
    public ResponseEntity<ResultadoAcademicoResponse> registrar(
            @Valid @RequestBody ResultadoAcademicoRequest request
    ) {
        ResultadoAcademicoResponse creado = resultadoService.registrar(request);

        return ResponseEntity
                .created(URI.create("/api/resultados-academicos/" + creado.id()))
                .body(creado);
    }
    
    @GetMapping
    public Page<ResultadoAcademicoResponse> listar(
            @RequestParam(required = false) String texto,
            @RequestParam(required = false) String resultado,
            @RequestParam(required = false) Long estudianteId,
            @RequestParam(required = false) Boolean verificado,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano
    ) {
        return resultadoService.listar(
                texto, resultado, estudianteId, verificado, pagina, tamano
        );
    }

    @GetMapping("/{id}")
    public ResultadoAcademicoResponse obtenerPorId(
            @PathVariable Long id
    ) {
        return resultadoService.obtenerPorId(id);
    }

    @PutMapping("/{id}")
    public ResultadoAcademicoResponse actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ResultadoAcademicoRequest request
    ) {
        return resultadoService.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(
            @PathVariable Long id
    ) {
        resultadoService.eliminar(id);
        return ResponseEntity.noContent().build();
    }

}


