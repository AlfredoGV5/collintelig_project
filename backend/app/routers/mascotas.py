from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import mascota_del_usuario, usuario_actual

router = APIRouter(prefix="/mascotas", tags=["Mascotas"])


@router.get("", response_model=list[schemas.MascotaOut])
def listar(usuario: models.Usuario = Depends(usuario_actual), db: Session = Depends(get_db)):
    consulta = (select(models.Mascota)
                .where(models.Mascota.usuario_id == usuario.id)
                .order_by(models.Mascota.nombre))
    return db.scalars(consulta).all()


@router.post("", response_model=schemas.MascotaOut, status_code=201)
def crear(datos: schemas.MascotaCrear, usuario: models.Usuario = Depends(usuario_actual),
          db: Session = Depends(get_db)):
    mascota = models.Mascota(usuario_id=usuario.id, **datos.model_dump())
    mascota.umbrales = models.UmbralesMascota()   # umbrales por defecto
    db.add(mascota)
    db.commit()
    db.refresh(mascota)
    return mascota


@router.get("/{mascota_id}", response_model=schemas.MascotaOut)
def obtener(mascota: models.Mascota = Depends(mascota_del_usuario)):
    return mascota


@router.patch("/{mascota_id}", response_model=schemas.MascotaOut)
def actualizar(datos: schemas.MascotaActualizar,
               mascota: models.Mascota = Depends(mascota_del_usuario),
               db: Session = Depends(get_db)):
    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(mascota, campo, valor)
    db.commit()
    db.refresh(mascota)
    return mascota


@router.delete("/{mascota_id}", status_code=204)
def eliminar(mascota: models.Mascota = Depends(mascota_del_usuario),
             db: Session = Depends(get_db)):
    db.delete(mascota)
    db.commit()


@router.get("/{mascota_id}/umbrales", response_model=schemas.Umbrales)
def ver_umbrales(mascota: models.Mascota = Depends(mascota_del_usuario),
                 db: Session = Depends(get_db)):
    if mascota.umbrales is None:
        mascota.umbrales = models.UmbralesMascota()
        db.commit()
        db.refresh(mascota.umbrales)
    return mascota.umbrales


@router.put("/{mascota_id}/umbrales", response_model=schemas.Umbrales)
def cambiar_umbrales(datos: schemas.Umbrales,
                     mascota: models.Mascota = Depends(mascota_del_usuario),
                     db: Session = Depends(get_db)):
    if mascota.umbrales is None:
        mascota.umbrales = models.UmbralesMascota()
    for campo, valor in datos.model_dump().items():
        setattr(mascota.umbrales, campo, valor)
    db.commit()
    db.refresh(mascota.umbrales)
    return mascota.umbrales