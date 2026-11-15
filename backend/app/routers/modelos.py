from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, defer

from app import models, schemas
from app.database import get_db
from app.deps import mascota_del_usuario
from app.services.entrenamiento import DatosInsuficientes, entrenar_mascota

router = APIRouter(prefix="/mascotas/{mascota_id}/modelo", tags=["Modelo ML"])


@router.post("/entrenar", response_model=schemas.ModeloOut, status_code=201)
def entrenar(mascota: models.Mascota = Depends(mascota_del_usuario),
             db: Session = Depends(get_db)):
    try:
        return entrenar_mascota(db, mascota.id)
    except DatosInsuficientes as error:
        raise HTTPException(409, str(error))


@router.get("", response_model=list[schemas.ModeloOut])
def historial(mascota: models.Mascota = Depends(mascota_del_usuario),
              db: Session = Depends(get_db)):
    consulta = (select(models.ModeloML).options(defer(models.ModeloML.archivo))
                .where(models.ModeloML.mascota_id == mascota.id)
                .order_by(models.ModeloML.version.desc()))
    return db.scalars(consulta).all()