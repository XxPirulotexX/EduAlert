
from pathlib import Path
import logging
from threading import Lock
from uuid import uuid4
import os

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier

logger = logging.getLogger("uvicorn.error")

app = FastAPI(
    title="EduAlerta ML Service",
    description="Preparación de datos y experimentación con modelos sintéticos",
    version="0.2.0",
)

DATA_DIR = Path(__file__).resolve().parent.parent / "dataset-trabajo" / "raw"
MODEL_DIR = Path(os.getenv("MODEL_DIR", str(Path(__file__).resolve().parent / "models"))).resolve()
MODEL_PATH = MODEL_DIR / "modelo_sintetico.joblib"
MODEL_LOCK = Lock()

DATASETS = {
    "estudiantes": "estudiantes_demo.csv",
    "evaluaciones_riesgo": "evaluaciones_riesgo_demo.csv",
    "alertas": "alertas_demo.csv",
}

FEATURES = [
    "promedio_actual",
    "promedio_periodo_anterior",
    "porcentaje_asistencia",
    "inasistencias_consecutivas",
    "asignaturas_perdidas",
    "entregas_pendientes",
    "participacion_academica",
    "acompanamiento_familiar",
]

TARGET = "resultado_simulado"
RANDOM_STATE = 42


class PredictionInput(BaseModel):
    promedio_actual: float = Field(ge=0, le=5)
    promedio_periodo_anterior: float = Field(ge=0, le=5)
    porcentaje_asistencia: float = Field(ge=0, le=100)
    inasistencias_consecutivas: int = Field(ge=0, le=60)
    asignaturas_perdidas: int = Field(ge=0, le=15)
    entregas_pendientes: int = Field(ge=0, le=30)
    participacion_academica: float = Field(ge=0, le=5)
    acompanamiento_familiar: float = Field(ge=0, le=5)


def load_dataset(filename: str) -> pd.DataFrame:
    path = DATA_DIR / filename

    if not path.is_file():
        raise FileNotFoundError(f"No se encontró el archivo: {path}")

    return pd.read_csv(path, encoding="utf-8-sig")


def generate_synthetic_dataset(n: int = 500) -> pd.DataFrame:
    """Genera datos artificiales reproducibles; no representan alumnos reales."""
    rng = np.random.default_rng(RANDOM_STATE)

    promedio_anterior = np.clip(rng.normal(3.5, 0.8, n), 0, 5)
    cambio = rng.normal(0, 0.55, n)
    promedio_actual = np.clip(promedio_anterior + cambio, 0, 5)
    asistencia = np.clip(rng.normal(87, 12, n), 35, 100)
    inasistencias = np.clip(
        np.rint((100 - asistencia) / 8 + rng.normal(0, 2, n)), 0, 20
    ).astype(int)
    asignaturas = np.clip(
        np.rint((3.2 - promedio_actual) * 2 + rng.normal(1, 1.5, n)),
        0,
        8,
    ).astype(int)
    entregas = np.clip(
        np.rint((100 - asistencia) / 15 + rng.normal(1, 1.8, n)),
        0,
        12,
    ).astype(int)
    participacion = np.clip(
        rng.normal(3.3, 1.0, n) - (100 - asistencia) / 100,
        0,
        5,
    )
    apoyo_familiar = np.clip(rng.normal(3.2, 1.1, n), 0, 5)

    # Regla generadora ficticia: solo sirve para demostrar el flujo de ML.
    score = (
        0.85 * (3.0 - promedio_actual)
        + 0.35 * (3.0 - promedio_anterior)
        + 0.035 * (80 - asistencia)
        + 0.12 * inasistencias
        + 0.22 * asignaturas
        + 0.10 * entregas
        + 0.18 * (3.0 - participacion)
        + 0.12 * (3.0 - apoyo_familiar)
        + rng.normal(0, 0.7, n)
    )

    # Etiqueta artificial: no es un registro real de deserción.
    resultado = np.where(score > 1.0, "posible_interrupcion_simulada", "continuidad_simulada")

    return pd.DataFrame({
        "promedio_actual": promedio_actual.round(2),
        "promedio_periodo_anterior": promedio_anterior.round(2),
        "porcentaje_asistencia": asistencia.round(2),
        "inasistencias_consecutivas": inasistencias,
        "asignaturas_perdidas": asignaturas,
        "entregas_pendientes": entregas,
        "participacion_academica": participacion.round(2),
        "acompanamiento_familiar": apoyo_familiar.round(2),
        TARGET: resultado,
    })


def build_pipeline(model):
    numeric_pipeline = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    preprocessing = ColumnTransformer([
        ("numeric", numeric_pipeline, FEATURES),
    ])

    return Pipeline([
        ("preprocessing", preprocessing),
        ("model", model),
    ])


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
        except (FileNotFoundError, pd.errors.ParserError, UnicodeDecodeError, OSError) as error:
            summary[name] = {
                "archivo": filename,
                "estado": "error_lectura",
                "detalle": str(error),
            }

    unavailable = [
        name for name, details in summary.items()
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
    required_columns = {
        "estudiantes": [
            "codigo_estudiantil", "grado", "promedio_actual", "estado"
        ],
        "evaluaciones_riesgo": [
            "evaluacion_id", "codigo_estudiantil", "nivel",
            "fuente", "version_modelo"
        ],
        "alertas": [
            "alerta_id", "codigo_estudiantil", "nivel_riesgo",
            "senal", "estado"
        ],
    }
    results = {}
    errors = []
    warnings = []
    info = []
    dataframes = {}

    for name, filename in DATASETS.items():
        try:
            df = load_dataset(filename)
            dataframes[name] = df
        except (FileNotFoundError, pd.errors.ParserError, UnicodeDecodeError, OSError) as error:
            errors.append({"conjunto": name, "mensaje": str(error)})
            results[name] = {"estado": "error_lectura"}
            continue

        dataset_errors = []
        dataset_warnings = []
        dataset_info = []

        missing_columns = [
            column for column in required_columns[name]
            if column not in df.columns
        ]

        if missing_columns:
            dataset_errors.append({
                "tipo": "columnas_faltantes",
                "columnas": missing_columns,
            })
        else:
            id_column = (
                "codigo_estudiantil" if name == "estudiantes"
                else "evaluacion_id" if name == "evaluaciones_riesgo"
                else "alerta_id"
            )

            if df[id_column].isna().any():
                dataset_errors.append({
                    "tipo": "identificadores_vacios",
                    "columna": id_column,
                    "cantidad": int(df[id_column].isna().sum()),
                })

            duplicates = int(df[id_column].dropna().duplicated().sum())
            if duplicates:
                dataset_errors.append({
                    "tipo": "identificadores_duplicados",
                    "columna": id_column,
                    "cantidad": duplicates,
                })

            for column in required_columns[name]:
                count = int(df[column].isna().sum())
                if count:
                    dataset_warnings.append({
                        "tipo": "valores_faltantes",
                        "columna": column,
                        "cantidad": count,
                    })

        risk_column = (
            "nivel" if name == "evaluaciones_riesgo"
            else "nivel_riesgo" if name == "alertas"
            else None
        )

        if risk_column and risk_column in df.columns:
            invalid = sorted(
                set(df[risk_column].dropna().astype(str).str.strip().str.lower())
                - {"bajo", "medio", "alto"}
            )
            if invalid:
                dataset_errors.append({
                    "tipo": "niveles_de_riesgo_invalidos",
                    "columna": risk_column,
                    "valores": invalid,
                })

        if name == "evaluaciones_riesgo" and "version_modelo" in df.columns:
            missing_versions = int(df["version_modelo"].isna().sum())
            if missing_versions:
                dataset_info.append({
                    "tipo": "version_modelo_no_registrada",
                    "cantidad": missing_versions,
                    "mensaje": "No atribuir estas evaluaciones a un modelo entrenado.",
                })

        if name == "alertas" and "actualizado_en" in df.columns:
            missing_dates = int(df["actualizado_en"].isna().sum())
            if missing_dates:
                dataset_info.append({
                    "tipo": "fecha_actualizacion_faltante",
                    "cantidad": missing_dates,
                })

        state = (
            "error" if dataset_errors
            else "advertencia" if dataset_warnings
            else "correcto"
        )
        results[name] = {
            "archivo": filename,
            "filas": len(df),
            "estado": state,
            "errores": dataset_errors,
            "advertencias": dataset_warnings,
            "informacion": dataset_info,
        }
        errors.extend({"conjunto": name, **item} for item in dataset_errors)
        warnings.extend({"conjunto": name, **item} for item in dataset_warnings)
        info.extend({"conjunto": name, **item} for item in dataset_info)

    students = dataframes.get("estudiantes")
    if students is not None and "codigo_estudiantil" in students.columns:
        known = set(students["codigo_estudiantil"].dropna().astype(str).str.strip())
        for name in ("evaluaciones_riesgo", "alertas"):
            df = dataframes.get(name)
            if df is None or "codigo_estudiantil" not in df.columns:
                continue
            referenced = set(df["codigo_estudiantil"].dropna().astype(str).str.strip())
            unknown = sorted(referenced - known)
            if unknown:
                warnings.append({
                    "conjunto": name,
                    "tipo": "referencias_fuera_del_csv",
                    "cantidad": len(unknown),
                    "codigos": unknown,
                    "mensaje": "Pueden pertenecer a estudiantes fuera del subconjunto demo.",
                })

    return {
        "estado": "error" if errors else "advertencia" if warnings else "correcto",
        "resumen": {
            "conjuntos": len(DATASETS),
            "conjuntos_cargados": len(dataframes),
            "errores": len(errors),
            "advertencias": len(warnings),
            "observaciones": len(info),
        },
        "conjuntos": results,
        "errores": errors,
        "advertencias": warnings,
        "informacion": info,
    }


@app.get("/datasets/prepare")
def prepare_datasets():
    prepared = {}
    errors = []

    for name, filename in DATASETS.items():
        try:
            df = load_dataset(filename).copy()

            for column in df.select_dtypes(include=["object"]).columns:
                df[column] = df[column].map(
                    lambda value: value.strip() if isinstance(value, str) else value
                )
                df[column] = df[column].replace("", pd.NA)

            if name == "estudiantes":
                df["promedio_actual"] = pd.to_numeric(
                    df["promedio_actual"], errors="coerce"
                )
                df["creado_en"] = pd.to_datetime(
                    df["creado_en"], errors="coerce", utc=True
                )
            elif name == "evaluaciones_riesgo":
                df["evaluacion_id"] = pd.to_numeric(
                    df["evaluacion_id"], errors="coerce"
                ).astype("Int64")
                df["version_modelo"] = df["version_modelo"].astype("string")
                df["creado_en"] = pd.to_datetime(
                    df["creado_en"], errors="coerce", utc=True
                )
                df["nivel"] = df["nivel"].str.lower()
            elif name == "alertas":
                df["alerta_id"] = pd.to_numeric(
                    df["alerta_id"], errors="coerce"
                ).astype("Int64")
                df["creado_en"] = pd.to_datetime(
                    df["creado_en"], errors="coerce", utc=True
                )
                df["actualizado_en"] = pd.to_datetime(
                    df["actualizado_en"], errors="coerce", utc=True
                )
                df["nivel_riesgo"] = df["nivel_riesgo"].str.lower()

            sample = df.head(3).astype(object).where(pd.notna(df.head(3)), None)
            prepared[name] = {
                "filas": len(df),
                "columnas": df.columns.tolist(),
                "tipos": {column: str(dtype) for column, dtype in df.dtypes.items()},
                "valores_faltantes": {
                    column: int(count) for column, count in df.isna().sum().items()
                },
                "muestra": sample.to_dict(orient="records"),
                "estado": "preparado",
            }
        except (
            FileNotFoundError, pd.errors.ParserError, UnicodeDecodeError,
            OSError, KeyError, ValueError
        ) as error:
            errors.append({"conjunto": name, "detalle": str(error)})

    return {
        "estado": "error" if errors else "correcto",
        "mensaje": (
            "Preparación en memoria completada. No se entrenó ningún modelo."
            if not errors else "Uno o más conjuntos no pudieron prepararse."
        ),
        "objetivo_desercion_disponible": False,
        "advertencia_modelado": (
            "Los CSV existentes no contienen un resultado real observado de deserción."
        ),
        "conjuntos": prepared,
        "errores": errors,
    }


@app.get("/modeling/readiness")
def modeling_readiness():
    try:
        students = load_dataset(DATASETS["estudiantes"]).copy()
    except (FileNotFoundError, pd.errors.ParserError, UnicodeDecodeError, OSError) as error:
        raise HTTPException(
            status_code=503,
            detail=f"No se pudo cargar el conjunto de estudiantes: {error}",
        )

    possible_targets = {
        "deserto", "desercion", "abandono", "abandono_escolar",
        "continuidad", "estado_final", "resultado_final",
        "dropout", "dropout_status",
    }
    targets = [
        column for column in students.columns
        if column.strip().lower() in possible_targets
    ]
    excluded = {"codigo_estudiantil", "estado", "creado_en"}
    features = [
        column for column in students.columns
        if column not in excluded
        and column not in targets
        and pd.api.types.is_numeric_dtype(students[column])
    ]

    return {
        "estado": "listo_para_exploracion" if not targets else "requiere_revision_de_etiqueta",
        "filas_disponibles": len(students),
        "variables_numericas_candidatas": features,
        "variables_objetivo_detectadas": targets,
        "valores_faltantes": {
            column: int(count) for column, count in students.isna().sum().items()
        },
        "entrenamiento_autorizado": False,
        "motivo": (
            "Los CSV actuales no acreditan resultados reales de deserción o continuidad."
        ),
        "siguiente_requisito": (
            "Usar datos sintéticos etiquetados explícitamente para la demostración, "
            "o incorporar resultados observados antes de cualquier validación real."
        ),
    }


@app.get("/modeling/synthetic-readiness")
def synthetic_readiness():
    df = generate_synthetic_dataset()
    return {
        "estado": "disponible_para_experimentacion",
        "origen": "sintetico",
        "es_dato_real": False,
        "semilla": RANDOM_STATE,
        "filas": len(df),
        "variables_entrada": FEATURES,
        "variable_objetivo": TARGET,
        "distribucion_objetivo": {
            str(key): int(value)
            for key, value in df[TARGET].value_counts().items()
        },
        "advertencia": (
            "La etiqueta es artificial y deriva de una regla simulada. "
            "Las métricas no representan desempeño sobre estudiantes reales."
        ),
    }


@app.post("/modeling/train")
def train_models():
    df = generate_synthetic_dataset()
    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.25,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    candidates = {
        "regresion_logistica": LogisticRegression(
            max_iter=1000,
            random_state=RANDOM_STATE,
        ),
        "bosque_aleatorio": RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            random_state=RANDOM_STATE,
            class_weight="balanced",
        ),
    }

    results = {}
    trained_models = {}

    for name, estimator in candidates.items():
        pipeline = build_pipeline(estimator)
        pipeline.fit(X_train, y_train)
        predictions = pipeline.predict(X_test)

        results[name] = {
            "precision_macro": round(
                precision_score(y_test, predictions, average="macro", zero_division=0), 4
            ),
            "recall_macro": round(
                recall_score(y_test, predictions, average="macro", zero_division=0), 4
            ),
            "f1_macro": round(
                f1_score(y_test, predictions, average="macro", zero_division=0), 4
            ),
            "exactitud": round(accuracy_score(y_test, predictions), 4),
            "matriz_confusion": confusion_matrix(
                y_test,
                predictions,
                labels=sorted(y.unique()),
            ).tolist(),
            "clases": sorted(y.unique()),
            "reporte_clasificacion": classification_report(
                y_test,
                predictions,
                output_dict=True,
                zero_division=0,
            ),
        }
        trained_models[name] = pipeline

    # Se guarda el modelo de bosque aleatorio como candidato de demostración.
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    modelo_guardado = {
        "modelo": trained_models["bosque_aleatorio"],
        "variables": FEATURES,
        "objetivo": TARGET,
        "origen_datos": "sintetico",
        "semilla": RANDOM_STATE,
        "version": app.version,
    }
    ruta_temporal = MODEL_DIR / f".{MODEL_PATH.name}.{uuid4().hex}.tmp"
    try:
        joblib.dump(modelo_guardado, ruta_temporal)
        # Sustitución atómica: una petición concurrente no lee un archivo incompleto.
        ruta_temporal.replace(MODEL_PATH)
    finally:
        ruta_temporal.unlink(missing_ok=True)

    return {
        "estado": "entrenamiento_experimental_completado",
        "origen_datos": "sintetico",
        "es_dato_real": False,
        "registros_totales": len(df),
        "registros_entrenamiento": len(X_train),
        "registros_prueba": len(X_test),
        "semilla": RANDOM_STATE,
        "resultados": results,
        "modelo_guardado": "modelo_sintetico.joblib",
        "advertencia": (
            "Resultados técnicos sobre etiquetas artificiales; no usar para decisiones "
            "reales ni interpretar como evidencia de predicción de deserción."
        ),
    }


def ensure_demo_model_exists() -> None:
    """Crea una sola vez el modelo artificial si todavía no existe en el volumen persistente."""
    if MODEL_PATH.is_file():
        return
    with MODEL_LOCK:
        if not MODEL_PATH.is_file():
            # La ruta de entrenamiento solo genera datos sintéticos y deja advertencia en su respuesta.
            train_models()


def _predict_with_saved_model(input_data: PredictionInput):
    """Carga y ejecuta el artefacto actual del modelo experimental."""
    saved = joblib.load(MODEL_PATH)
    if not isinstance(saved, dict) or "modelo" not in saved:
        raise ValueError("El archivo guardado no contiene la estructura esperada.")

    model = saved["modelo"]
    features = pd.DataFrame([input_data.model_dump()], columns=FEATURES)
    prediction = str(model.predict(features)[0])
    probabilities = model.predict_proba(features)[0]

    try:
        classes = model.named_steps["model"].classes_
    except (AttributeError, KeyError, TypeError) as error:
        raise ValueError("El pipeline guardado no contiene las clases esperadas.") from error

    if len(classes) != len(probabilities):
        raise ValueError("Las probabilidades del modelo no corresponden a sus clases.")

    return {
        "prediccion": prediction,
        "probabilidades": {
            str(label): round(float(probability), 4)
            for label, probability in zip(classes, probabilities)
        },
        "origen_datos": "sintetico",
        "es_dato_real": False,
        "advertencia": (
            "Predicción demostrativa basada en un modelo entrenado con datos sintéticos; "
            "no representa un diagnóstico ni una predicción validada sobre estudiantes reales."
        ),
    }


@app.post("/modeling/predict")
def predict(input_data: PredictionInput):
    try:
        ensure_demo_model_exists()
        return _predict_with_saved_model(input_data)
    except Exception:
        # Mantiene la excepción completa en los logs del contenedor, no en la respuesta pública.
        logger.exception(
            "Falló la carga o predicción con el artefacto ML actual en %s",
            MODEL_PATH,
        )

    # Un artefacto persistido puede existir y aun así estar dañado o ser incompatible.
    # Se elimina solo ese archivo y se vuelve a entrenar una vez con datos sintéticos.
    try:
        with MODEL_LOCK:
            MODEL_PATH.unlink(missing_ok=True)
            train_models()
            return _predict_with_saved_model(input_data)
    except Exception:
        logger.exception(
            "No fue posible regenerar y usar el modelo ML experimental en %s",
            MODEL_PATH,
        )
        raise HTTPException(
            status_code=503,
            detail=(
                "No fue posible cargar o regenerar el modelo experimental. "
                "Revisa los registros del servicio ML."
            ),
        ) from None
