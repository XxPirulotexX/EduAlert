package co.edualerta.api.auth;

import co.edualerta.api.usuarios.Usuario;
import co.edualerta.api.usuarios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/** Crea la primera cuenta administrativa desde variables de entorno, si aún no existe. */
@Component
public class BootstrapAdminInitializer implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String email;
    private final String password;
    private final String nombres;
    private final String apellidos;

    public BootstrapAdminInitializer(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.bootstrap-admin.enabled:true}") boolean enabled,
            @Value("${app.bootstrap-admin.email}") String email,
            @Value("${app.bootstrap-admin.password:}") String password,
            @Value("${app.bootstrap-admin.nombres:Administrador}") String nombres,
            @Value("${app.bootstrap-admin.apellidos:EduAlerta}") String apellidos
    ) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.email = email;
        this.password = password;
        this.nombres = nombres;
        this.apellidos = apellidos;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!enabled) return;

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (usuarioRepository.existsByCorreoIgnoreCase(normalizedEmail)) {
            // No se restablece ni sobrescribe la contraseña de una cuenta existente.
            return;
        }

        if (password == null || password.length() < 10 || password.length() > 72) {
            throw new IllegalStateException(
                    "Configura BOOTSTRAP_ADMIN_PASSWORD con entre 10 y 72 caracteres en backend/.env."
            );
        }

        Usuario admin = new Usuario();
        admin.setNombres(nombres.trim());
        admin.setApellidos(apellidos.trim());
        admin.setCorreo(normalizedEmail);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRol("ADMINISTRADOR");
        admin.setEstado("activo");
        usuarioRepository.save(admin);

        // Nunca se registra la contraseña ni su hash en los logs.
        System.out.println("Cuenta inicial de administrador preparada: " + normalizedEmail);
    }
}
