package co.edualerta.api.resultados;

import co.edualerta.api.estudiantes.Estudiante;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Index;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(
        name = "resultado_academico",
        indexes = {
                @Index(
                        name = "idx_resultado_academico_estudiante_fecha",
                        columnList = "estudiante_id, fecha_observacion"
                )
        }
)
public class ResultadoAcademico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "estudiante_id", nullable = false)
    private Estudiante estudiante;

    @Column(nullable = false, length = 20)
    private String resultado = "DESCONOCIDO";

    @Column(name = "fecha_observacion")
    private LocalDate fechaObservacion;

    @Column(name = "fuente_evidencia", length = 150)
    private String fuenteEvidencia;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    @Column(nullable = false)
    private boolean verificado = false;

    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @Column(name = "actualizado_en")
    private Instant actualizadoEn;

    @PrePersist
    protected void alCrear() {
        normalizarCampos();
        creadoEn = Instant.now();
    }

    @PreUpdate
    protected void alActualizar() {
        normalizarCampos();
        actualizadoEn = Instant.now();
    }

    private void normalizarCampos() {
        if (resultado != null) {
            resultado = resultado.trim().toUpperCase(java.util.Locale.ROOT);
        }
        if (fuenteEvidencia != null) {
            fuenteEvidencia = fuenteEvidencia.trim();
        }
        if (observaciones != null) {
            observaciones = observaciones.trim();
        }
    }

    public Long getId() {
        return id;
    }

    public Estudiante getEstudiante() {
        return estudiante;
    }

    public void setEstudiante(Estudiante estudiante) {
        this.estudiante = estudiante;
    }

    public String getResultado() {
        return resultado;
    }

    public void setResultado(String resultado) {
        this.resultado = resultado;
    }

    public LocalDate getFechaObservacion() {
        return fechaObservacion;
    }

    public void setFechaObservacion(LocalDate fechaObservacion) {
        this.fechaObservacion = fechaObservacion;
    }

    public String getFuenteEvidencia() {
        return fuenteEvidencia;
    }

    public void setFuenteEvidencia(String fuenteEvidencia) {
        this.fuenteEvidencia = fuenteEvidencia;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public boolean isVerificado() {
        return verificado;
    }

    public void setVerificado(boolean verificado) {
        this.verificado = verificado;
    }

    public Instant getCreadoEn() {
        return creadoEn;
    }

    public Instant getActualizadoEn() {
        return actualizadoEn;
    }
}
