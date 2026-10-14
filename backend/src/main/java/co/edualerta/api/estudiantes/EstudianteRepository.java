package co.edualerta.api.estudiantes;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EstudianteRepository extends JpaRepository<Estudiante, Long> {
    boolean existsByCodigoEstudiantilIgnoreCase(String codigoEstudiantil);
    boolean existsByCodigoEstudiantilIgnoreCaseAndIdNot(String codigoEstudiantil, Long id);

    /** Localiza la ficha vinculada a una cuenta para limitar el acceso del rol estudiante. */
    Optional<Estudiante> findByUsuario_Id(Long usuarioId);
}
