from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import usuario_actual
from app.security import generar_api_key, hash_api_key

router = APIRouter(prefix="/dispositivos", tags=["Collares"])


@router.post("", response_model=schemas.DispositivoCreado, status_code=201)
def registrar(datos: schemas.DispositivoCrear,
              usuario: models.Usuario = Depends(usuario_actual),
              db: Session = Depends(get_db)):
    mascota = db.get(models.Mascota, datos.mascota_id)
    if not mascota or mascota.usuario_id != usuario.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mascota no encontrada")
    if mascota.dispositivo is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Esta mascota ya tiene un collar")
    if db.scalar(select(models.Dispositivo)
                 .where(models.Dispositivo.codigo_serie == datos.codigo_serie)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Ese número de serie ya existe")

    api_key = generar_api_key()
    disp = models.Dispositivo(codigo_serie=datos.codigo_serie, mascota_id=mascota.id,
                              api_key_hash=hash_api_key(api_key))
    db.add(disp)
    db.commit()
    db.refresh(disp)
    base = schemas.DispositivoOut.model_validate(disp).model_dump()
    return schemas.DispositivoCreado(**base, api_key=api_key)


@router.get("", response_model=list[schemas.DispositivoOut])
def listar(usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    consulta = (select(models.Dispositivo)
                .join(models.Mascota, models.Mascota.id == models.Dispositivo.mascota_id)
                .where(models.Mascota.usuario_id == usuario.id))
    return db.scalars(consulta).all()