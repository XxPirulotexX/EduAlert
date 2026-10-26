package co.edualerta.api.usuarios;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

/** Consultas de persistencia para encontrar cuentas por su correo normalizado. */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCaseAndIdNot(String correo, Long id);

    /** Consulta paginada sin exponer passwordHash en la respuesta. */
    @Query(value = """
            select new co.edualerta.api.usuarios.UsuarioResponse(
                u.id, u.nombres, u.apellidos, u.correo, lower(u.rol), u.estado,
                (select e.id from Estudiante e where e.usuario.id = u.id), u.creadoEn
            )
            from Usuario u
            where (:texto = ''
                   or lower(u.nombres) like concat('%', :texto, '%')
                   or lower(u.apellidos) like concat('%', :texto, '%')
                   or lower(concat(u.nombres, ' ', u.apellidos)) like concat('%', :texto, '%')
                   or lower(u.correo) like concat('%', :texto, '%')
                   or lower(u.rol) like concat('%', :texto, '%'))
            order by lower(u.apellidos), lower(u.nombres), u.id
            """,
            countQuery = """
            select count(u) from Usuario u
            where (:texto = ''
                   or lower(u.nombres) like concat('%', :texto, '%')
                   or lower(u.apellidos) like concat('%', :texto, '%')
                   or lower(concat(u.nombres, ' ', u.apellidos)) like concat('%', :texto, '%')
                   or lower(u.correo) like concat('%', :texto, '%')
                   or lower(u.rol) like concat('%', :texto, '%'))
            """)
    Page<UsuarioResponse> buscarPaginado(@Param("texto") String texto, Pageable pageable);
}



