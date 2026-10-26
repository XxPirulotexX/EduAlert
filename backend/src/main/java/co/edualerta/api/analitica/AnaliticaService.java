package co.edualerta.api.analitica;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Construye el resumen de analítica mediante conteos agregados ejecutados en PostgreSQL. */
@Service
public class AnaliticaService {

    private final AnaliticaRepository analiticaRepository;

    public AnaliticaService(AnaliticaRepository analiticaRepository) {
        this.analiticaRepository = analiticaRepository;
    }

    @Transactional(readOnly = true)
    public AnaliticaResumenResponse obtenerResumen() {
        return new AnaliticaResumenResponse(
                analiticaRepository.contarFichas(),
                analiticaRepository.contarFichasActivas(),
                analiticaRepository.promedioActualDeActivos(),
                analiticaRepository.contarActivosConPromedio(),
                analiticaRepository.contarAlertasActivas(),
                analiticaRepository.contarAlertasRiesgoAltoActivas(),
                analiticaRepository.contarAlertasHistoricas(),
                analiticaRepository.contarRiesgoVigente(),
                analiticaRepository.contarAlertasPorEstado()
        );
    }
}
