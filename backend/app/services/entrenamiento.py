import logging
from datetime import timedelta

import pandas as pd
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.database import SessionLocal
from app.ml import detector
from app.utils import ahora_utc

log = logging.getLogger("collintelig.entrenamiento")
VA = models.VentanaActividad


class DatosInsuficientes(Exception):
    pass


def entrenar_mascota(db: Session, mascota_id: int) -> models.ModeloML:
    desde = ahora_utc() - timedelta(days=settings.DIAS_ENTRENAMIENTO)
    consulta = (select(VA.inicio, VA.mag_media, VA.mag_std, VA.mag_max, VA.mag_p95,
                       VA.energia, VA.giro_medio, VA.cruces_media)
                .where(VA.mascota_id == mascota_id, VA.inicio >= desde))
    df = pd.read_sql(consulta, db.connection())
    if len(df) < settings.MIN_VENTANAS_ENTRENAMIENTO:
        raise DatosInsuficientes(
            f"Hay {len(df)} minutos de datos; se necesitan al menos "
            f"{settings.MIN_VENTANAS_ENTRENAMIENTO}.")

    umbrales = db.get(models.UmbralesMascota, mascota_id)
    contamination = umbrales.sensibilidad_ml if umbrales else 0.05
    archivo, metricas = detector.entrenar(df, contamination)

    version = (db.scalar(select(func.max(models.ModeloML.version))
                         .where(models.ModeloML.mascota_id == mascota_id)) or 0) + 1
    db.execute(update(models.ModeloML).where(models.ModeloML.mascota_id == mascota_id)
               .values(activo=False).execution_options(synchronize_session=False))
    modelo = models.ModeloML(mascota_id=mascota_id, version=version, archivo=archivo,
                             n_ventanas_entrenamiento=len(df),
                             parametros={"contamination": contamination, "n_estimators": 200},
                             metricas=metricas, activo=True)
    db.add(modelo)
    db.commit()
    db.refresh(modelo)
    detector.invalidar_cache(mascota_id)
    log.info("Mascota %s: modelo v%d entrenado con %d ventanas", mascota_id, version, len(df))
    return modelo


def reentrenar_todos() -> None:
    with SessionLocal() as db:
        ids = db.scalars(select(models.Dispositivo.mascota_id)
                         .where(models.Dispositivo.mascota_id.is_not(None),
                                models.Dispositivo.activo.is_(True))).all()
        for mascota_id in ids:
            try:
                entrenar_mascota(db, mascota_id)
            except DatosInsuficientes as error:
                log.info("Mascota %s: %s", mascota_id, error)
            except Exception:
                db.rollback()
                log.exception("Error reentrenando la mascota %s", mascota_id)