package co.edualerta.api.alertas;

import java.time.Instant;

public record SeguimientoAlertaResponse(
        Long id,
        Long alertaId,
        Long responsableUsuarioId,
        String responsable,
        String observaciones,
        Instant creadoEn
) {
    public static SeguimientoAlertaResponse desde(SeguimientoAlerta seguimiento) {
        var usuario = seguimiento.getResponsable();
        return new SeguimientoAlertaResponse(
                seguimiento.getId(), seguimiento.getAlerta().getId(), usuario.getId(),
                usuario.getNombres() + " " + usuario.getApellidos(),
                seguimiento.getObservaciones(), seguimiento.getCreadoEn()
        );
    }
}
