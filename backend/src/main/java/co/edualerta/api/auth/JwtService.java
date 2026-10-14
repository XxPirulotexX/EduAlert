package co.edualerta.api.auth;

import co.edualerta.api.usuarios.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

/** Firma y verifica JWT con HS256; el secreto procede de una variable de entorno. */
@Service
public class JwtService {

    private final SecretKey signingKey;
    private final long ttlSeconds;

    public JwtService(
            @Value("${security.jwt.secret}") String base64Secret,
            @Value("${security.jwt.ttl-seconds:28800}") long ttlSeconds
    ) {
        // La clave debe ser Base64 y contener al menos 256 bits para HS256.
        byte[] keyBytes = Decoders.BASE64.decode(base64Secret);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT_SECRET debe decodificar al menos 32 bytes.");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
        this.ttlSeconds = ttlSeconds;
    }

    public String generarToken(Usuario usuario) {
        Instant ahora = Instant.now();

        // El rol se incluye en el token para trazabilidad; el filtro también confirma
        // que la cuenta siga activa y obtiene el rol vigente desde PostgreSQL.
        return Jwts.builder()
                .subject(usuario.getCorreo())
                .claim("uid", usuario.getId())
                .claim("rol", usuario.getRol())
                .issuedAt(Date.from(ahora))
                .expiration(Date.from(ahora.plusSeconds(ttlSeconds)))
                .signWith(signingKey)
                .compact();
    }

    public Claims leerClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getTtlSeconds() {
        return ttlSeconds;
    }
}
