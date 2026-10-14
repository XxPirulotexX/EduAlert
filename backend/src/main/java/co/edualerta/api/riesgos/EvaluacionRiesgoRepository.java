package co.edualerta.api.riesgos;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EvaluacionRiesgoRepository extends JpaRepository<EvaluacionRiesgo, Long> {
    Optional<EvaluacionRiesgo> findFirstByEstudiante_IdOrderByCreadoEnDescIdDesc(Long estudianteId);
    List<EvaluacionRiesgo> findByEstudiante_IdOrderByCreadoEnDescIdDesc(Long estudianteId);
}
