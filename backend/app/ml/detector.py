import io
import threading

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.config import settings

FEATURES_MODELO = ["mag_media", "mag_std", "mag_max", "mag_p95", "energia",
                   "giro_medio", "cruces_media", "hora_sin", "hora_cos"]

_cache: dict[int, tuple[int, Pipeline]] = {}     # mascota_id -> (version, modelo)
_lock = threading.Lock()


def preparar_matriz(df: pd.DataFrame) -> np.ndarray:
    datos = df.copy()
    local = (pd.to_datetime(datos["inicio"]).dt.tz_localize("UTC")
             .dt.tz_convert(settings.ZONA_HORARIA))
    horas = local.dt.hour + local.dt.minute / 60
    datos["hora_sin"] = np.sin(2 * np.pi * horas / 24)
    datos["hora_cos"] = np.cos(2 * np.pi * horas / 24)
    return datos[FEATURES_MODELO].astype(float).fillna(0.0).to_numpy()


def entrenar(df: pd.DataFrame, contamination: float = 0.05) -> tuple[bytes, dict]:
    X = preparar_matriz(df)
    modelo = Pipeline([
        ("escalar", StandardScaler()),
        ("iforest", IsolationForest(n_estimators=200, contamination=contamination,
                                    random_state=42)),
    ])
    modelo.fit(X)
    pred = modelo.predict(X)
    scores = -modelo.decision_function(X)          # mayor = más anómalo
    metricas = {
        "n_ventanas": int(len(X)),
        "pct_anomalias_entrenamiento": round(float((pred == -1).mean()) * 100, 2),
        "score_p50": round(float(np.percentile(scores, 50)), 4),
        "score_p99": round(float(np.percentile(scores, 99)), 4),
        "features": FEATURES_MODELO,
    }
    buffer = io.BytesIO()
    joblib.dump(modelo, buffer)
    return buffer.getvalue(), metricas


def predecir(modelo: Pipeline, df: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
    X = preparar_matriz(df)
    return -modelo.decision_function(X), modelo.predict(X) == -1


def obtener_modelo(db: Session, mascota_id: int) -> Pipeline | None:
    """Modelo activo de la mascota, con caché en memoria por versión."""
    fila = db.execute(select(models.ModeloML.id, models.ModeloML.version)
                      .where(models.ModeloML.mascota_id == mascota_id,
                             models.ModeloML.activo.is_(True))
                      .order_by(models.ModeloML.version.desc()).limit(1)).first()
    if fila is None:
        return None
    with _lock:
        guardado = _cache.get(mascota_id)
        if guardado and guardado[0] == fila.version:
            return guardado[1]
    archivo = db.scalar(select(models.ModeloML.archivo).where(models.ModeloML.id == fila.id))
    modelo = joblib.load(io.BytesIO(archivo))
    with _lock:
        _cache[mascota_id] = (fila.version, modelo)
    return modelo


def invalidar_cache(mascota_id: int) -> None:
    with _lock:
        _cache.pop(mascota_id, None)