package co.edualerta.api.alertas;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SeguimientoAlertaRepository extends JpaRepository<SeguimientoAlerta, Long> {
    List<SeguimientoAlerta> findByAlerta_IdOrderByCreadoEnDescIdDesc(Long alertaId);
}
