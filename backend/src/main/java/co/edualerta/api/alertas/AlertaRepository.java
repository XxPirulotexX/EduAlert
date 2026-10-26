package co.edualerta.api.alertas;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AlertaRepository extends JpaRepository<AlertaTemprana, Long> {

    /** Consulta paginada con búsqueda y filtros; trae la ficha relacionada en una sola consulta. */
    @Query(value = """
            select a from AlertaTemprana a
            join fetch a.estudiante e
            where ((:estado = '' and lower(a.estado) <> 'archivada')
                   or (:estado <> '' and lower(a.estado) = :estado))
              and (:nivelRiesgo = '' or lower(a.nivelRiesgo) = :nivelRiesgo)
              and (:estudianteId is null or e.id = :estudianteId)
              and (:grado = ''
                   or (:grado = '__otros__' and (e.grado is null or (
                       lower(e.grado) not like '%10%' and lower(e.grado) not like '%11%'
                       and lower(e.grado) not like '%decim%' and lower(e.grado) not like '%once%'
                       and lower(e.grado) not like '%undecim%'
                   )))
                   or (:grado <> '__otros__' and lower(e.grado) like concat('%', :grado, '%')))
              and (:texto = ''
                   or lower(a.senal) like concat('%', :texto, '%')
                   or lower(e.codigoEstudiantil) like concat('%', :texto, '%')
                   or lower(e.nombres) like concat('%', :texto, '%')
                   or lower(e.apellidos) like concat('%', :texto, '%')
                   or lower(concat(e.nombres, ' ', e.apellidos)) like concat('%', :texto, '%'))
            order by a.creadoEn desc, a.id desc
            """,
            countQuery = """
            select count(a) from AlertaTemprana a join a.estudiante e
            where ((:estado = '' and lower(a.estado) <> 'archivada')
                   or (:estado <> '' and lower(a.estado) = :estado))
              and (:nivelRiesgo = '' or lower(a.nivelRiesgo) = :nivelRiesgo)
              and (:estudianteId is null or e.id = :estudianteId)
              and (:grado = ''
                   or (:grado = '__otros__' and (e.grado is null or (
                       lower(e.grado) not like '%10%' and lower(e.grado) not like '%11%'
                       and lower(e.grado) not like '%decim%' and lower(e.grado) not like '%once%'
                       and lower(e.grado) not like '%undecim%'
                   )))
                   or (:grado <> '__otros__' and lower(e.grado) like concat('%', :grado, '%')))
              and (:texto = ''
                   or lower(a.senal) like concat('%', :texto, '%')
                   or lower(e.codigoEstudiantil) like concat('%', :texto, '%')
                   or lower(e.nombres) like concat('%', :texto, '%')
                   or lower(e.apellidos) like concat('%', :texto, '%')
                   or lower(concat(e.nombres, ' ', e.apellidos)) like concat('%', :texto, '%'))
            """)
    Page<AlertaTemprana> buscarPaginado(
            @Param("texto") String texto,
            @Param("estado") String estado,
            @Param("nivelRiesgo") String nivelRiesgo,
            @Param("grado") String grado,
            @Param("estudianteId") Long estudianteId,
            Pageable pageable
    );
}
