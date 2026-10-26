package co.edualerta.api.resultados;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ResultadoAcademicoRepository
        extends JpaRepository<ResultadoAcademico, Long> {

    /** Búsqueda/filtros parametrizados, paginados y con la ficha relacionada cargada. */
    @Query(value = """
            select r from ResultadoAcademico r
            join fetch r.estudiante e
            where (:texto = ''
                   or lower(e.codigoEstudiantil) like concat('%', :texto, '%')
                   or lower(e.nombres) like concat('%', :texto, '%')
                   or lower(e.apellidos) like concat('%', :texto, '%')
                   or lower(concat(e.nombres, ' ', e.apellidos)) like concat('%', :texto, '%')
                   or lower(coalesce(r.fuenteEvidencia, '')) like concat('%', :texto, '%')
                   or lower(coalesce(r.observaciones, '')) like concat('%', :texto, '%'))
              and (:resultado = '' or r.resultado = :resultado)
              and (:estudianteId is null or r.estudiante.id = :estudianteId)
              and (:verificado is null or r.verificado = :verificado)
            """,
            countQuery = """
            select count(r) from ResultadoAcademico r
            where (:texto = ''
                   or lower(r.estudiante.codigoEstudiantil) like concat('%', :texto, '%')
                   or lower(r.estudiante.nombres) like concat('%', :texto, '%')
                   or lower(r.estudiante.apellidos) like concat('%', :texto, '%')
                   or lower(concat(r.estudiante.nombres, ' ', r.estudiante.apellidos)) like concat('%', :texto, '%')
                   or lower(coalesce(r.fuenteEvidencia, '')) like concat('%', :texto, '%')
                   or lower(coalesce(r.observaciones, '')) like concat('%', :texto, '%'))
              and (:resultado = '' or r.resultado = :resultado)
              and (:estudianteId is null or r.estudiante.id = :estudianteId)
              and (:verificado is null or r.verificado = :verificado)
            """)
    Page<ResultadoAcademico> buscarPaginado(
            @Param("texto") String texto,
            @Param("resultado") String resultado,
            @Param("estudianteId") Long estudianteId,
            @Param("verificado") Boolean verificado,
            Pageable pageable
    );

    @Query(value = "select r from ResultadoAcademico r join fetch r.estudiante e where e.id = :estudianteId",
            countQuery = "select count(r) from ResultadoAcademico r where r.estudiante.id = :estudianteId")
    Page<ResultadoAcademico> buscarPorEstudiante(
            @Param("estudianteId") Long estudianteId, Pageable pageable
    );

    @Query(value = "select r from ResultadoAcademico r join fetch r.estudiante e where r.verificado = true",
            countQuery = "select count(r) from ResultadoAcademico r where r.verificado = true")
    Page<ResultadoAcademico> buscarVerificados(Pageable pageable);
}
