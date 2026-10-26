package co.edualerta.api.estudiantes;

import co.edualerta.api.riesgos.EvaluacionRiesgo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    boolean existsByCodigoEstudiantilIgnoreCase(String codigoEstudiantil);
    boolean existsByCodigoEstudiantilIgnoreCaseAndIdNot(String codigoEstudiantil, Long id);

    /** Localiza la ficha vinculada a una cuenta para limitar el acceso del rol estudiante. */
    Optional<Estudiante> findByUsuario_Id(Long usuarioId);

    /**
     * Consulta paginada con filtros opcionales. La proyección obtiene el último riesgo en la
     * misma consulta para evitar consultas N+1 al construir el listado principal.
     */
    @Query(value = """
            select new co.edualerta.api.estudiantes.EstudianteResponse(
                e.id, u.id, e.codigoEstudiantil, e.nombres, e.apellidos, e.estado,
                e.grado, e.promedioActual,
                coalesce((select r.nivel from EvaluacionRiesgo r
                          where r.id = (select max(r2.id) from EvaluacionRiesgo r2
                                        where r2.estudiante.id = e.id)), 'sin_evaluar'),
                (select r3.observaciones from EvaluacionRiesgo r3
                 where r3.id = (select max(r4.id) from EvaluacionRiesgo r4
                                where r4.estudiante.id = e.id)),
                e.creadoEn, e.actualizadoEn
            )
            from Estudiante e left join e.usuario u
            where (:texto = ''
                   or lower(e.codigoEstudiantil) like concat('%', :texto, '%')
                   or lower(e.nombres) like concat('%', :texto, '%')
                   or lower(e.apellidos) like concat('%', :texto, '%')
                   or lower(concat(e.nombres, ' ', e.apellidos)) like concat('%', :texto, '%'))
              and (:estado = '' or lower(e.estado) = :estado)
              and (:grado = '' or lower(e.grado) like concat('%', :grado, '%'))
              and (
                    :nivelRiesgo = ''
                    or (:nivelRiesgo = 'sin_evaluar' and not exists (
                        select r0 from EvaluacionRiesgo r0 where r0.estudiante.id = e.id))
                    or exists (
                        select r1 from EvaluacionRiesgo r1
                        where r1.estudiante.id = e.id
                          and r1.id = (select max(r2.id) from EvaluacionRiesgo r2
                                       where r2.estudiante.id = e.id)
                          and lower(r1.nivel) = :nivelRiesgo)
              )
            order by lower(e.apellidos), lower(e.nombres), e.id
            """,
            countQuery = """
            select count(e) from Estudiante e
            where (:texto = ''
                   or lower(e.codigoEstudiantil) like concat('%', :texto, '%')
                   or lower(e.nombres) like concat('%', :texto, '%')
                   or lower(e.apellidos) like concat('%', :texto, '%')
                   or lower(concat(e.nombres, ' ', e.apellidos)) like concat('%', :texto, '%'))
              and (:estado = '' or lower(e.estado) = :estado)
              and (:grado = '' or lower(e.grado) like concat('%', :grado, '%'))
              and (
                    :nivelRiesgo = ''
                    or (:nivelRiesgo = 'sin_evaluar' and not exists (
                        select r0 from EvaluacionRiesgo r0 where r0.estudiante.id = e.id))
                    or exists (
                        select r1 from EvaluacionRiesgo r1
                        where r1.estudiante.id = e.id
                          and r1.id = (select max(r2.id) from EvaluacionRiesgo r2
                                       where r2.estudiante.id = e.id)
                          and lower(r1.nivel) = :nivelRiesgo)
              )
            """)
    Page<EstudianteResponse> buscarPaginado(
            @Param("texto") String texto,
            @Param("estado") String estado,
            @Param("nivelRiesgo") String nivelRiesgo,
            @Param("grado") String grado,
            Pageable pageable
    );
}
