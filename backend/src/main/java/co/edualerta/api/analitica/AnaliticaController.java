package co.edualerta.api.analitica;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Punto de consulta para tarjetas y gráficos del panel analítico. */
@RestController
@RequestMapping("/api/analitica")
public class AnaliticaController {

    private final AnaliticaService analiticaService;

    public AnaliticaController(AnaliticaService analiticaService) {
        this.analiticaService = analiticaService;
    }

    @GetMapping("/resumen")
    public AnaliticaResumenResponse obtenerResumen() {
        return analiticaService.obtenerResumen();
    }
}
