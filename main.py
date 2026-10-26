from pathlib import Path

import pandas as pd
from fastapi import FastAPI, HTTPException

app = FastAPI(
    title="EduAlerta ML Service",
    description="Servicio de preparación y validación de datos para EduAlerta",
    version="0.1.0",
)

DATA_DIR = Path(__file__).resolve().parent.parent / "dataset-trabajo" / "raw"

DATASETS = {
    "estudiantes": "estudiantes_demo.csv",
    "evaluaciones_riesgo": "evaluaciones_riesgo_demo.csv",
    "alertas": "alertas_demo.csv",
}


def load_dataset(filename: str) -> pd.DataFrame:
    path = DATA_DIR / filename

    if not path.is_file():
        raise FileNotFoundError(f"No se encontró el archivo: {path}")

    return pd.read_csv(path, encoding="utf-8-sig")


def clean_text(series: pd.Series) -> pd.Series:
    return series.astype("string").str.strip()


def find_duplicates(df: pd.DataFrame, column: str) -> list:
    if column not in df.columns:
        return []

    values = clean_text(df[column])
    duplicated = values.notna() & values.ne("") & values.duplicated(keep=False)

    return sorted(values[duplicated].dropna().unique().tolist())


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "edualerta-ml-service",
        "version": app.version,
    }


@app.get("/datasets")
def datasets_summary():
    summary = {}

    for name, filename in DATASETS.items():
        try:
            df = load_dataset(filename)

            summary[name] = {
                "archivo": filename,
                "filas": len(df),
                "columnas": df.columns.tolist(),
                "valores_faltantes_por_columna": {
                    column: int(count)
                    for column, count in df.isna().sum().items()
                },
                "estado": "cargado",
            }
        except FileNotFoundError as error:
            summary[name] = {
                "archivo": filename,
                "estado": "no_disponible",
                "detalle": str(error),
            }
        except (pd.errors.ParserError, UnicodeDecodeError, OSError) as error:
            summary[name] = {
                "archivo": filename,
                "estado": "error_lectura",
                "detalle": str(error),
            }

    unavailable = [
        name
        for name, details in summary.items()
        if details["estado"] != "cargado"
    ]

    if unavailable:
        raise HTTPException(
            status_code=503,
            detail={
                "mensaje": "No fue posible cargar todos los conjuntos de datos.",
                "conjuntos": summary,
            },
        )

    return {"conjuntos": summary}


@app.get("/datasets/validate")
def validate_datasets():
    try:
        students = load_dataset(DATASETS["estudiantes"])
        evaluations = load_dataset(DATASETS["evaluaciones_riesgo"])
        alerts = load_dataset(DATASETS["alertas"])
    except (FileNotFoundError, pd.errors.ParserError, UnicodeDecodeError, OSError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    findings = []

    def add_finding(severity, code, message, count=0, examples=None):
        findings.append({
            "severidad": severity,
            "codigo": code,
            "mensaje": message,
            "cantidad": count,
            "ejemplos": (examples or [])[:10],
        })

    required_columns = {
        "estudiantes": (students, [
            "codigo_estudiantil", "grado", "promedio_actual", "estado"
        ]),
        "evaluaciones_riesgo": (evaluations, [
            "evaluacion_id", "codigo_estudiantil", "nivel", "fuente"
        ]),
        "alertas": (alerts, [
            "alerta_id", "codigo_estudiantil", "nivel_riesgo", "estado"
        ]),
    }

    missing_schema = False

    for dataset_name, (df, required) in required_columns.items():
        absent = [column for column in required if column not in df.columns]

        if absent:
            missing_schema = True
            add_finding(
                "error",
                "COLUMNAS_AUSENTES",
                f"El conjunto {dataset_name} no contiene todas las columnas requeridas.",
                len(absent),
                absent,
            )

    if missing_schema:
        return {
            "estado": "error_esquema",
            "conjuntos_revisados": 3,
            "hallazgos": findings,
            "nota": "Corrige el esquema CSV antes de evaluar la calidad de los registros.",
        }

    # Campos que deben tener un valor para identificar y relacionar los registros.
    required_values = {
        "estudiantes": (students, ["codigo_estudiantil", "grado", "promedio_actual"]),
        "evaluaciones_riesgo": (
            evaluations, ["evaluacion_id", "codigo_estudiantil", "nivel", "fuente"]
        ),
        "alertas": (
            alerts, ["alerta_id", "codigo_estudiantil", "nivel_riesgo", "estado"]
        ),
    }

    for dataset_name, (df, columns) in required_values.items():
        for column in columns:
            values = clean_text(df[column])
            missing = values.isna() | values.eq("")

            if missing.any():
                add_finding(
                    "error",
                    "VALOR_REQUERIDO_AUSENTE",
                    f"Hay valores vacíos en {dataset_name}.{column}.",
                    int(missing.sum()),
                    df.index[missing].tolist(),
                )

    # Los identificadores deben ser únicos dentro de cada conjunto.
    for dataset_name, df, column in [
        ("estudiantes", students, "codigo_estudiantil"),
        ("evaluaciones_riesgo", evaluations, "evaluacion_id"),
        ("alertas", alerts, "alerta_id"),
    ]:
        duplicates = find_duplicates(df, column)

        if duplicates:
            add_finding(
                "error",
                "IDENTIFICADOR_DUPLICADO",
                f"Hay identificadores duplicados en {dataset_name}.{column}.",
                len(duplicates),
                duplicates,
            )

    student_codes = set(
        clean_text(students["codigo_estudiantil"]).dropna().tolist()
    )
    student_codes.discard("")

    # Como estos CSV son subconjuntos de demostración, una referencia ausente
    # se reporta como advertencia: puede corresponder a un estudiante excluido
    # del CSV y no necesariamente a una relación rota en la base de datos.
    for dataset_name, df in [
        ("evaluaciones_riesgo", evaluations),
        ("alertas", alerts),
    ]:
        codes = clean_text(df["codigo_estudiantil"])
        unmatched = sorted(
            codes[codes.notna() & codes.ne("") & ~codes.isin(student_codes)]
            .unique()
            .tolist()
        )

        if unmatched:
            add_finding(
                "advertencia",
                "ESTUDIANTE_FUERA_DEL_SUBCONJUNTO",
                f"Hay referencias en {dataset_name} que no aparecen en estudiantes_demo.csv.",
                len(unmatched),
                unmatched,
            )

    # Validar categorías sin convertirlas en resultados reales de deserción.
    for dataset_name, df, column in [
        ("evaluaciones_riesgo", evaluations, "nivel"),
        ("alertas", alerts, "nivel_riesgo"),
    ]:
        levels = clean_text(df[column]).str.lower()
        invalid = sorted(
            levels[levels.notna() & levels.ne("")
                   & ~levels.isin(["bajo", "medio", "alto"])]
            .unique()
            .tolist()
        )

        if invalid:
            add_finding(
                "error",
                "NIVEL_RIESGO_INVALIDO",
                f"Se encontraron niveles no reconocidos en {dataset_name}.{column}.",
                len(invalid),
                invalid,
            )

    # La versión del modelo y la fecha de actualización pueden ser nulas
    # según el origen del registro; se informan, pero no se inventan valores.
    if "version_modelo" in evaluations.columns:
        empty_versions = clean_text(evaluations["version_modelo"]).isna() | (
            clean_text(evaluations["version_modelo"]) == ""
        )

        if empty_versions.any():
            add_finding(
                "informacion",
                "VERSION_MODELO_NO_REGISTRADA",
                "Hay evaluaciones sin versión de modelo registrada; no se asumen como predicciones de IA.",
                int(empty_versions.sum()),
            )

    if "actualizado_en" in alerts.columns:
        empty_updated = alerts["actualizado_en"].isna() | (
            clean_text(alerts["actualizado_en"]) == ""
        )

        if empty_updated.any():
            add_finding(
                "informacion",
                "FECHA_ACTUALIZACION_AUSENTE",
                "Algunas alertas no tienen fecha de actualización.",
                int(empty_updated.sum()),
            )

    errors = sum(item["severidad"] == "error" for item in findings)
    warnings = sum(item["severidad"] == "advertencia" for item in findings)
    info = sum(item["severidad"] == "informacion" for item in findings)

    return {
        "estado": "requiere_revision" if errors or warnings else "validado",
        "registros": {
            "estudiantes": len(students),
            "evaluaciones_riesgo": len(evaluations),
            "alertas": len(alerts),
        },
        "resumen_hallazgos": {
            "errores": errors,
            "advertencias": warnings,
            "informacion": info,
        },
        "hallazgos": findings,
        "nota": (
            "La validación se realiza sobre CSV de demostración. "
            "Una referencia fuera del subconjunto no prueba por sí sola "
            "una inconsistencia en la base de datos."
        ),
    }
