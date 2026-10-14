package co.edualerta.api.alertas;

import co.edualerta.api.usuarios.Usuario;
import jakarta.persistence.*;
import java.time.Instant;

/** Nota de seguimiento asociada a una alerta y al usuario que la registró. */
@Entity
@Table(name = "seguimiento_alerta")
public class SeguimientoAlerta {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "alerta_id", nullable = false)
    private AlertaTemprana alerta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "responsable_usuario_id", nullable = false)
    private Usuario responsable;

    @Column(nullable = false, length = 1000)
    private String observaciones;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @PrePersist
    protected void alCrear() {
        observaciones = observaciones == null ? null : observaciones.trim();
        creadoEn = Instant.now();
    }

    public Long getId() { return id; }
    public AlertaTemprana getAlerta() { return alerta; }
    public void setAlerta(AlertaTemprana alerta) { this.alerta = alerta; }
    public Usuario getResponsable() { return responsable; }
    public void setResponsable(Usuario responsable) { this.responsable = responsable; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public Instant getCreadoEn() { return creadoEn; }
}
