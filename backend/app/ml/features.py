import numpy as np
import pandas as pd

# Límites de desviación estándar de la magnitud (en g) para el nivel de actividad.
# Valores de arranque: calíbralos con videos + datos reales de tu perro.
LIMITES_NIVEL = [(0.03, "reposo"), (0.15, "ligera"), (0.40, "moderada")]


def calcular_features(ventana: pd.DataFrame) -> dict:
    """ventana: DataFrame con columnas ax, ay, az, gx, gy, gz, magnitud de UN minuto."""
    mag = ventana["magnitud"].to_numpy(dtype=float)
    centrada = mag - mag.mean()
    cruces = int(np.count_nonzero(np.diff(np.signbit(centrada))))   # aproxima pasos

    giro = None
    if ventana[["gx", "gy", "gz"]].notna().all().all():
        giro = float(np.sqrt(ventana["gx"] ** 2 + ventana["gy"] ** 2 + ventana["gz"] ** 2).mean())

    return {
        "mag_media": float(mag.mean()),
        "mag_std": float(mag.std()),
        "mag_min": float(mag.min()),
        "mag_max": float(mag.max()),
        "mag_p95": float(np.percentile(mag, 95)),
        "energia": float(np.mean((mag - 1.0) ** 2)),   # quita la gravedad (1 g)
        "giro_medio": giro,
        "cruces_media": min(cruces, 65535),
    }


def clasificar_nivel(mag_std: float) -> str:
    for limite, nivel in LIMITES_NIVEL:
        if mag_std < limite:
            return nivel
    return "intensa"