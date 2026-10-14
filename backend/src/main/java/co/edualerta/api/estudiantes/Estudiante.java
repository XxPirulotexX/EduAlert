package co.edualerta.api.estudiantes;

import co.edualerta.api.usuarios.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;

/** Ficha básica del estudiante; conserva los indicadores actuales usados por el MVP. */
@Entity
@Table(
        name = "estudiante",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_estudiante_codigo_estudiantil",
                columnNames = "codigo_estudiantil"
        )
)
public class Estudiante {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Una ficha puede existir antes de que el estudiante tenga una cuenta de acceso.
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", unique = true)
    private Usuario usuario;

    @Column(name = "codigo_estudiantil", nullable = false, length = 50)
    private String codigoEstudiantil;

    @Column(nullable = false, length = 100)
    private String nombres;

    @Column(nullable = false, length = 100)
    private String apellidos;

    @Column(nullable = false, length = 20)
    private String estado = "activo";

    // Grado y promedio son el resumen académico vigente; el detalle por asignatura
    // y período podrá normalizarse en tablas académicas cuando ese módulo se integre.
    @Column(length = 10)
    private String grado;

    @Column(name = "promedio_actual", precision = 3, scale = 2)
    private BigDecimal promedioActual;

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
        if (codigoEstudiantil != null) codigoEstudiantil = codigoEstudiantil.trim().toUpperCase(Locale.ROOT);
        if (nombres != null) nombres = nombres.trim();
        if (apellidos != null) apellidos = apellidos.trim();
        if (estado != null) estado = estado.trim().toLowerCase(Locale.ROOT);
        if (grado != null) grado = grado.trim();
    }

    public Long getId() { return id; }
    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
    public String getCodigoEstudiantil() { return codigoEstudiantil; }
    public void setCodigoEstudiantil(String codigoEstudiantil) { this.codigoEstudiantil = codigoEstudiantil; }
    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
    public String getGrado() { return grado; }
    public void setGrado(String grado) { this.grado = grado; }
    public BigDecimal getPromedioActual() { return promedioActual; }
    public void setPromedioActual(BigDecimal promedioActual) { this.promedioActual = promedioActual; }
    public Instant getCreadoEn() { return creadoEn; }
    public Instant getActualizadoEn() { return actualizadoEn; }
}
