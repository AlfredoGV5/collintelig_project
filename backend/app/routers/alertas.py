from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import usuario_actual

router = APIRouter(prefix="/alertas", tags=["Alertas"])


@router.get("", response_model=list[schemas.AlertaOut])
def listar(mascota_id: int | None = None, solo_no_leidas: bool = False,
           limite: int = Query(50, ge=1, le=200),
           usuario: models.Usuario = Depends(usuario_actual),
           db: Session = Depends(get_db)):
    consulta = (select(models.Alerta)
                .join(models.Mascota, models.Mascota.id == models.Alerta.mascota_id)
                .where(models.Mascota.usuario_id == usuario.id))
    if mascota_id:
        consulta = consulta.where(models.Alerta.mascota_id == mascota_id)
    if solo_no_leidas:
        consulta = consulta.where(models.Alerta.leida.is_(False))
    return db.scalars(consulta.order_by(models.Alerta.ts_evento.desc()).limit(limite)).all()


@router.patch("/{alerta_id}/leida", response_model=schemas.AlertaOut)
def marcar_leida(alerta_id: int, usuario: models.Usuario = Depends(usuario_actual),
                 db: Session = Depends(get_db)):
    alerta = db.get(models.Alerta, alerta_id)
    if not alerta or db.get(models.Mascota, alerta.mascota_id).usuario_id != usuario.id:
        raise HTTPException(404, "Alerta no encontrada")
    alerta.leida = True
    db.commit()
    return alerta


@router.post("/marcar-todas-leidas", status_code=204)
def marcar_todas(usuario: models.Usuario = Depends(usuario_actual),
                 db: Session = Depends(get_db)):
    mis_mascotas = select(models.Mascota.id).where(models.Mascota.usuario_id == usuario.id)
    db.execute(update(models.Alerta)
               .where(models.Alerta.mascota_id.in_(mis_mascotas), models.Alerta.leida.is_(False))
               .values(leida=True)
               .execution_options(synchronize_session=False))
    db.commit()