import logging
from datetime import timedelta

import pandas as pd
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.database import SessionLocal
from app.ml import detector
from app.ml.features import calcular_features, clasificar_nivel
from app.ml.reglas import evaluar_reglas
from app.services.notificaciones import enviar_push_alerta
from app.utils import ahora_utc, alinear

log = logging.getLogger("collintelig.procesamiento")
V = settings.VENTANA_SEGUNDOS
L = models.Lectura


def aplicar_modelo(db: Session, mascota_id: int, ventanas: list[models.VentanaActividad]) -> None:
    modelo = detector.obtener_modelo(db, mascota_id)
    if modelo is None:
        return                      # aún no hay modelo entrenado: solo reglas
    columnas = ["inicio", "mag_media", "mag_std", "mag_max", "mag_p95",
                "energia", "giro_medio", "cruces_media"]
    df = pd.DataFrame([{c: getattr(v, c) for c in columnas} for v in ventanas])
    scores, anomalas = detector.predecir(modelo, df)
    for v, score, anomala in zip(ventanas, scores, anomalas):
        v.score_anomalia = float(score)
        v.es_anomalia = bool(anomala)


def calcular_ventanas(db: Session, disp: models.Dispositivo, ahora) -> list[models.VentanaActividad]:
    desde = disp.procesado_hasta
    if desde is None:
        primera = db.scalar(select(func.min(L.ts)).where(L.dispositivo_id == disp.id))
        if primera is None:
            return []
        desde = alinear(primera, V)

    ultima = db.scalar(select(func.max(L.ts)).where(L.dispositivo_id == disp.id))
    hasta = min(alinear(ahora - timedelta(seconds=settings.MARGEN_LOTES_SEGUNDOS), V),
                alinear(ultima, V),                      # no procesar el minuto en curso
                desde + timedelta(hours=settings.MAX_HORAS_POR_CICLO))
    if hasta <= desde:
        return []

    consulta = (select(L.ts, L.ax, L.ay, L.az, L.gx, L.gy, L.gz, L.magnitud)
                .where(L.dispositivo_id == disp.id, L.ts >= desde, L.ts < hasta)
                .order_by(L.ts))
    df = pd.read_sql(consulta, db.connection())
    disp.procesado_hasta = hasta
    if df.empty:
        return []

    df["inicio"] = pd.to_datetime(df["ts"]).dt.floor(f"{V}s")
    minimo = int(V * disp.frecuencia_hz * 0.3)      # al menos 30 % de las muestras esperadas
    ventanas = []
    for inicio, grupo in df.groupby("inicio"):
        if len(grupo) < minimo:
            continue
        f = calcular_features(grupo)
        ini = inicio.to_pydatetime()
        ventanas.append(models.VentanaActividad(
            dispositivo_id=disp.id, mascota_id=disp.mascota_id,
            inicio=ini, fin=ini + timedelta(seconds=V),
            n_muestras=min(len(grupo), 65535),
            nivel_actividad=clasificar_nivel(f["mag_std"]), **f))

    if ventanas and disp.mascota_id:
        aplicar_modelo(db, disp.mascota_id, ventanas)
    db.add_all(ventanas)
    db.flush()
    return ventanas


def ciclo_procesamiento() -> None:
    ahora = ahora_utc()
    with SessionLocal() as db:
        collares = db.scalars(select(models.Dispositivo)
                              .where(models.Dispositivo.activo.is_(True),
                                     models.Dispositivo.mascota_id.is_not(None))).all()
        for disp in collares:
            try:
                nuevas = calcular_ventanas(db, disp, ahora)
                alertas = evaluar_reglas(db, disp, ahora, nuevas)
                db.commit()
            except Exception:
                db.rollback()
                log.exception("Error procesando el collar %s", disp.id)
                continue
            if nuevas or alertas:
                log.info("Collar %s: %d ventanas nuevas, %d alertas",
                         disp.id, len(nuevas), len(alertas))
            for alerta in alertas:
                enviar_push_alerta(db, alerta)


def purgar_lecturas_antiguas() -> None:
    """Borra lecturas crudas más viejas que la retención, en bloques para no bloquear la BD."""
    limite = ahora_utc() - timedelta(days=settings.RETENCION_LECTURAS_DIAS)
    total = 0
    with SessionLocal() as db:
        while True:
            resultado = db.execute(text("DELETE FROM lecturas WHERE ts < :limite LIMIT 50000"),
                                   {"limite": limite})
            db.commit()
            total += resultado.rowcount
            if resultado.rowcount < 50000:
                break
    log.info("Lecturas purgadas: %d", total)