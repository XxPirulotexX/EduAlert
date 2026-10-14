package co.edualerta.api.config;

import co.edualerta.api.security.JwtAuthenticationFilter;
import co.edualerta.api.usuarios.UsuarioRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/** Reglas centralizadas de autenticación y autorización para la API REST. */
@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        // BCrypt guarda hashes de contraseña, nunca contraseñas en texto plano.
        return new BCryptPasswordEncoder();
    }

    /**
     * Evita que Spring Boot cree una cuenta temporal con contraseña generada.
     * Esta consulta también deja preparada una fuente de usuarios respaldada por PostgreSQL.
     */
    @Bean
    public UserDetailsService userDetailsService(UsuarioRepository usuarioRepository) {
        return email -> usuarioRepository.findByCorreoIgnoreCase(email)
                .map(usuario -> User.withUsername(usuario.getCorreo())
                        .password(usuario.getPasswordHash())
                        .authorities("ROLE_" + usuario.getRol())
                        .disabled(!"activo".equalsIgnoreCase(usuario.getEstado()))
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Cuenta no encontrada"));
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter
    ) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write(
                                    "{\"status\":401,\"code\":\"UNAUTHORIZED\","
                                            + "\"message\":\"Debes iniciar sesión para acceder a este recurso.\","
                                            + "\"fieldErrors\":{}}"
                            );
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write(
                                    "{\"status\":403,\"code\":\"FORBIDDEN\","
                                            + "\"message\":\"Tu cuenta no tiene permiso para esta operación.\","
                                            + "\"fieldErrors\":{}}"
                            );
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                        .requestMatchers("/api/health/**").permitAll()
                        .requestMatchers("/api/auth/me").authenticated()
                        // Lectura de fichas: administración, docencia y orientación.
                        .requestMatchers(HttpMethod.GET, "/api/estudiantes", "/api/estudiantes/**")
                            .hasAnyRole("ADMINISTRADOR", "DOCENTE", "ORIENTADOR")
                        // Modificación de fichas: administración y docencia.
                        .requestMatchers(HttpMethod.POST, "/api/estudiantes", "/api/estudiantes/**")
                            .hasAnyRole("ADMINISTRADOR", "DOCENTE")
                        .requestMatchers(HttpMethod.PUT, "/api/estudiantes/**")
                            .hasAnyRole("ADMINISTRADOR", "DOCENTE")
                        .requestMatchers(HttpMethod.DELETE, "/api/estudiantes/**")
                            .hasAnyRole("ADMINISTRADOR", "DOCENTE")
                        // Alertas y sus seguimientos están disponibles para el personal autorizado.
                        .requestMatchers(HttpMethod.GET, "/api/alertas", "/api/alertas/**")
                            .hasAnyRole("ADMINISTRADOR", "DOCENTE", "ORIENTADOR")
                        .requestMatchers(HttpMethod.POST, "/api/alertas", "/api/alertas/**")
                            .hasAnyRole("ADMINISTRADOR", "DOCENTE", "ORIENTADOR")
                        .requestMatchers(HttpMethod.PATCH, "/api/alertas/**")
                            .hasAnyRole("ADMINISTRADOR", "DOCENTE", "ORIENTADOR")
                        // La gestión de cuentas es exclusiva de administración.
                        .requestMatchers("/api/admin/**").hasRole("ADMINISTRADOR")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /** Evita que Spring Boot registre el filtro dos veces fuera de la cadena de seguridad. */
    @Bean
    public FilterRegistrationBean<JwtAuthenticationFilter> desactivarRegistroServlet(
            JwtAuthenticationFilter filter
    ) {
        FilterRegistrationBean<JwtAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
        registration.setEnabled(false);
        return registration;
    }

}
