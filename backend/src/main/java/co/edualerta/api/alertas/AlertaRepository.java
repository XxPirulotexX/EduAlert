package co.edualerta.api.alertas;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertaRepository extends JpaRepository<AlertaTemprana, Long> {
}
