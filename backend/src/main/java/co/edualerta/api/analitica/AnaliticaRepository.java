package co.edualerta.api.analitica;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.LinkedHashMap;
import java.util.Map;

/** Consultas agregadas para analítica; no materializa colecciones completas de estudiantes/alertas. */
@Repository
public class AnaliticaRepository {

    private final JdbcTemplate jdbcTemplate;

    public AnaliticaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public long contarFichas() {
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(id) FROM estudiante", Long.class);
        return total == null ? 0L : total;
    }

    public long contarFichasActivas() {
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(id) FROM estudiante WHERE LOWER(estado) = 'activo'", Long.class);
        return total == null ? 0L : total;
    }

    public Double promedioActualDeActivos() {
        return jdbcTemplate.queryForObject(
                "SELECT AVG(promedio_actual) FROM estudiante " +
                        "WHERE LOWER(estado) = 'activo' AND promedio_actual IS NOT NULL",
                Double.class);
    }

    public long contarActivosConPromedio() {
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(id) FROM estudiante " +
                        "WHERE LOWER(estado) = 'activo' AND promedio_actual IS NOT NULL",
                Long.class);
        return total == null ? 0L : total;
    }

    /** El indicador vigente se identifica por fecha de creación y, en empate, por ID. */
    public Map<String, Long> contarRiesgoVigente() {
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("bajo", 0L);
        result.put("medio", 0L);
        result.put("alto", 0L);
        result.put("sin_evaluar", 0L);

        jdbcTemplate.query("""
                SELECT COALESCE(LOWER(ultima.nivel), 'sin_evaluar') AS nivel,
                       COUNT(e.id) AS total
                FROM estudiante e
                LEFT JOIN LATERAL (
                    SELECT r.nivel
                    FROM evaluacion_riesgo r
                    WHERE r.estudiante_id = e.id
                    ORDER BY r.creado_en DESC, r.id DESC
                    LIMIT 1
                ) ultima ON TRUE
                WHERE LOWER(e.estado) = 'activo'
                GROUP BY COALESCE(LOWER(ultima.nivel), 'sin_evaluar')
                """, rs -> {
            String nivel = rs.getString("nivel");
            if (result.containsKey(nivel)) {
                result.put(nivel, rs.getLong("total"));
            }
        });
        return result;
    }

    public long contarAlertasActivas() {
        Long total = jdbcTemplate.queryForObject("""
                SELECT COUNT(id)
                FROM alerta_temprana
                WHERE LOWER(estado) IN ('nueva', 'en seguimiento')
                """, Long.class);
        return total == null ? 0L : total;
    }

    public long contarAlertasRiesgoAltoActivas() {
        Long total = jdbcTemplate.queryForObject("""
                SELECT COUNT(id)
                FROM alerta_temprana
                WHERE LOWER(estado) IN ('nueva', 'en seguimiento')
                  AND LOWER(nivel_riesgo) = 'alto'
                """, Long.class);
        return total == null ? 0L : total;
    }

    public long contarAlertasHistoricas() {
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(id) FROM alerta_temprana", Long.class);
        return total == null ? 0L : total;
    }

    public Map<String, Long> contarAlertasPorEstado() {
        Map<String, Long> result = new LinkedHashMap<>();
        result.put("Nueva", 0L);
        result.put("En seguimiento", 0L);
        result.put("Revisada", 0L);

        jdbcTemplate.query("""
                SELECT LOWER(estado) AS estado, COUNT(id) AS total
                FROM alerta_temprana
                WHERE LOWER(estado) IN ('nueva', 'en seguimiento', 'revisada')
                GROUP BY LOWER(estado)
                """, rs -> {
            String estado = rs.getString("estado");
            for (String permitido : result.keySet()) {
                if (permitido.equalsIgnoreCase(estado)) {
                    result.put(permitido, rs.getLong("total"));
                    break;
                }
            }
        });
        return result;
    }
}
