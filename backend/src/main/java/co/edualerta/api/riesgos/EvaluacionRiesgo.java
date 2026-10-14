package co.edualerta.api.riesgos;

import co.edualerta.api.estudiantes.Estudiante;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.Locale;

/** Registro histórico de cada cambio de nivel de riesgo de un estudiante. */
@Entity
@Table(name = "evaluacion_riesgo")
public class EvaluacionRiesgo {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @Column(nullable = false, length = 20)
    private String nivel;

    @Column(length = 500)
    private String observaciones;

    // MANUAL distingue una clasificación del personal de una predicción ML.
    @Column(nullable = false, length = 30)
    private String fuente = "MANUAL";

    @Column(name = "version_modelo", length = 80)
    private String versionModelo;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @PrePersist
    protected void alCrear() {
        if (nivel != null) nivel = nivel.trim().toLowerCase(Locale.ROOT);
        if (fuente != null) fuente = fuente.trim().toUpperCase(Locale.ROOT);
        if (observaciones != null) observaciones = observaciones.trim();
        creadoEn = Instant.now();
    }

    public Long getId() { return id; }
    public Estudiante getEstudiante() { return estudiante; }
    public void setEstudiante(Estudiante estudiante) { this.estudiante = estudiante; }
    public String getNivel() { return nivel; }
    public void setNivel(String nivel) { this.nivel = nivel; }
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    public String getFuente() { return fuente; }
    public void setFuente(String fuente) { this.fuente = fuente; }
    public String getVersionModelo() { return versionModelo; }
    public void setVersionModelo(String versionModelo) { this.versionModelo = versionModelo; }
    public Instant getCreadoEn() { return creadoEn; }
}
