from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import mascota_del_usuario
from app.utils import ahora_utc

router = APIRouter(prefix="/mascotas/{mascota_id}", tags=["Actividad"])
VA = models.VentanaActividad


@router.get("/ventanas", response_model=list[schemas.VentanaOut])
def ventanas(desde: datetime | None = None, hasta: datetime | None = None,
             mascota: models.Mascota = Depends(mascota_del_usuario),
             db: Session = Depends(get_db)):
    """Ventanas de 1 minuto. Por defecto, las últimas 24 h. Fechas en UTC."""
    hasta = hasta or ahora_utc()
    desde = desde or hasta - timedelta(hours=24)
    consulta = (select(VA).where(VA.mascota_id == mascota.id,
                                 VA.inicio >= desde, VA.inicio < hasta)
                .order_by(VA.inicio))
    return db.scalars(consulta).all()


@router.get("/resumen-diario", response_model=list[schemas.ResumenDiario])
def resumen_diario(dias: int = Query(7, ge=1, le=90),
                   mascota: models.Mascota = Depends(mascota_del_usuario),
                   db: Session = Depends(get_db)):
    filas = db.execute(text("""
        SELECT fecha, min_reposo, min_ligera, min_moderada, min_intensa,
               ventanas_anomalas, minutos_registrados
        FROM v_resumen_diario
        WHERE mascota_id = :m AND fecha >= CURDATE() - INTERVAL :d DAY
        ORDER BY fecha"""), {"m": mascota.id, "d": dias}).mappings().all()
    return [schemas.ResumenDiario(**f) for f in filas]


@router.get("/estado", response_model=schemas.EstadoMascota)
def estado(mascota: models.Mascota = Depends(mascota_del_usuario),
           db: Session = Depends(get_db)):
    ultima = db.scalar(select(VA).where(VA.mascota_id == mascota.id)
                       .order_by(VA.inicio.desc()).limit(1))
    sin_leer = db.scalar(select(func.count()).select_from(models.Alerta)
                         .where(models.Alerta.mascota_id == mascota.id,
                                models.Alerta.leida.is_(False)))
    con_modelo = db.scalar(select(func.count()).select_from(models.ModeloML)
                           .where(models.ModeloML.mascota_id == mascota.id,
                                  models.ModeloML.activo.is_(True))) > 0
    disp = mascota.dispositivo
    return schemas.EstadoMascota(
        mascota_id=mascota.id, nombre=mascota.nombre,
        nivel_actual=ultima.nivel_actividad if ultima else None,
        ultima_ventana=ultima.inicio if ultima else None,
        bateria_pct=disp.bateria_pct if disp else None,
        ultima_conexion=disp.ultima_conexion if disp else None,
        alertas_sin_leer=sin_leer, modelo_entrenado=con_modelo)