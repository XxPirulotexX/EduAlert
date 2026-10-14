package co.edualerta.api.usuarios;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/** Consultas de persistencia para encontrar cuentas por su correo normalizado. */
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByCorreoIgnoreCase(String correo);

    boolean existsByCorreoIgnoreCase(String correo);
}
