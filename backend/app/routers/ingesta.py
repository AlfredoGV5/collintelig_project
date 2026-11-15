from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import insert
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import dispositivo_actual
from app.utils import ahora_utc, desde_epoch_ms

router = APIRouter(prefix="/ingesta", tags=["Collar (ingesta)"])


@router.post("/lecturas", response_model=schemas.LoteRespuesta, status_code=201)
def recibir_lote(lote: schemas.LoteLecturas,
                 disp: models.Dispositivo = Depends(dispositivo_actual),
                 db: Session = Depends(get_db)):
    ahora = ahora_utc()
    filas = []
    for m in lote.muestras:
        ts = desde_epoch_ms(m.t)
        if ts < ahora - timedelta(days=7) or ts > ahora + timedelta(minutes=5):
            raise HTTPException(422, f"Hora fuera de rango ({ts:%Y-%m-%d %H:%M:%S} UTC). "
                                     "¿El collar sincronizó la hora por NTP?")
        filas.append({"dispositivo_id": disp.id, "ts": ts,
                      "ax": m.ax, "ay": m.ay, "az": m.az,
                      "gx": m.gx, "gy": m.gy, "gz": m.gz})

    db.execute(insert(models.Lectura), filas)   # inserción masiva
    disp.ultima_conexion = ahora
    if lote.bateria_pct is not None:
        disp.bateria_pct = lote.bateria_pct
    if lote.firmware_version:
        disp.firmware_version = lote.firmware_version
    db.commit()
    return schemas.LoteRespuesta(recibidas=len(filas))