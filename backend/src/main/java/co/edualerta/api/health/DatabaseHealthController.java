package co.edualerta.api.health;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/** Endpoint de diagnóstico para confirmar que la API puede ejecutar consultas en PostgreSQL. */
@RestController
@RequestMapping("/api/health")
public class DatabaseHealthController {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> comprobarBaseDatos() {
        try {
            String database = jdbcTemplate.queryForObject("SELECT current_database()", String.class);
            Instant horaServidor = jdbcTemplate.queryForObject(
                    "SELECT CURRENT_TIMESTAMP", (resultSet, rowNum) -> resultSet.getTimestamp(1).toInstant()
            );
            return ResponseEntity.ok(Map.of(
                    "status", "ok",
                    "database", database,
                    "serverTime", horaServidor
            ));
        } catch (DataAccessException exception) {
            // No devolver detalles SQL ni credenciales al cliente.
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of(
                    "status", "error",
                    "message", "La API no pudo consultar PostgreSQL. Revisa el servicio y la configuración."
            ));
        }
    }
}
