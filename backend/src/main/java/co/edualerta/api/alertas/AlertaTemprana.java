package co.edualerta.api.alertas;

import co.edualerta.api.estudiantes.Estudiante;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Locale;

/** Alerta persistida y vinculada a una ficha real de estudiante. */
@Entity
@Table(name = "alerta_temprana")
public class AlertaTemprana {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @Column(nullable = false, length = 500)
    private String senal;

    // Nivel registrado al crear la alerta; sirve como contexto histórico del evento.
    @Column(name = "nivel_riesgo", nullable = false, length = 20)
    private String nivelRiesgo = "sin_evaluar";

    @Column(nullable = false, length = 30)
    private String estado = "Nueva";

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(name = "actualizado_en")
    private Instant actualizadoEn;

    @PrePersist
    protected void alCrear() {
        normalizar();
        creadoEn = Instant.now();
    }

    @PreUpdate
    protected void alActualizar() {
        normalizar();
        actualizadoEn = Instant.now();
    }

    private void normalizar() {
        if (senal != null) senal = senal.trim();
        if (nivelRiesgo != null) nivelRiesgo = nivelRiesgo.trim().toLowerCase(Locale.ROOT);
        if (estado != null) {
            String valor = estado.trim().toLowerCase(Locale.ROOT);
            estado = switch (valor) {
                case "nueva" -> "Nueva";
                case "en seguimiento" -> "En seguimiento";
                case "revisada" -> "Revisada";
                case "archivada" -> "Archivada";
                default -> estado.trim();
            };
        }
    }

    public Long getId() { return id; }
    public Estudiante getEstudiante() { return estudiante; }
    public void setEstudiante(Estudiante estudiante) { this.estudiante = estudiante; }
    public String getSenal() { return senal; }
    public void setSenal(String senal) { this.senal = senal; }
    public String getNivelRiesgo() { return nivelRiesgo; }
    public void setNivelRiesgo(String nivelRiesgo) { this.nivelRiesgo = nivelRiesgo; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public Instant getCreadoEn() { return creadoEn; }
    public Instant getActualizadoEn() { return actualizadoEn; }
}



