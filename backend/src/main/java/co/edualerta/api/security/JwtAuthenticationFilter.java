package co.edualerta.api.security;

import co.edualerta.api.auth.JwtService;
import co.edualerta.api.usuarios.Usuario;
import co.edualerta.api.usuarios.UsuarioRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Locale;
import java.util.List;

/** Verifica el Bearer token y carga el rol vigente consultándolo en PostgreSQL. */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(JwtService jwtService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");

        if (authorization != null && authorization.startsWith("Bearer ")
                && SecurityContextHolder.getContext().getAuthentication() == null) {
            String token = authorization.substring(7).trim();

            try {
                Claims claims = jwtService.leerClaims(token);
                String email = claims.getSubject();

                usuarioRepository.findByCorreoIgnoreCase(email)
                        .filter(usuario -> "activo".equalsIgnoreCase(usuario.getEstado()))
                        .ifPresent(usuario -> establecerAutenticacion(usuario));
            } catch (JwtException | IllegalArgumentException exception) {
                // Los tokens inválidos o vencidos no crean una sesión autenticada.
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }

    private void establecerAutenticacion(Usuario usuario) {
        String rol = usuario.getRol().toUpperCase(Locale.ROOT);
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        usuario.getCorreo(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + rol))
                );
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }
}
