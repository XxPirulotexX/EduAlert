package co.edualerta.api.analitica;

import java.util.Map;

/** Resumen agregado para paneles: devuelve conteos sin descargar registros individuales. */
public record AnaliticaResumenResponse(
        long totalFichas,
        long fichasActivas,
        Double promedioActual,
        long fichasConPromedio,
        long alertasActivas,
        long alertasRiesgoAltoActivas,
        long alertasHistoricas,
        Map<String, Long> distribucionRiesgo,
        Map<String, Long> distribucionAlertas
) {
}
