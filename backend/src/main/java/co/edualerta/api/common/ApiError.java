package co.edualerta.api.common;

import java.time.Instant;
import java.util.Map;

/** Forma uniforme para que el frontend pueda mostrar errores de validación y negocio. */
public record ApiError(
        Instant timestamp,
        int status,
        String code,
        String message,
        Map<String, String> fieldErrors
) {
}
