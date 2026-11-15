from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.security import decodificar_token, hash_api_key

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def usuario_actual(token: str = Depends(oauth2_scheme),
                   db: Session = Depends(get_db)) -> models.Usuario:
    usuario_id = decodificar_token(token)
    usuario = db.get(models.Usuario, usuario_id) if usuario_id else None
    if not usuario or not usuario.activo:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token inválido o expirado",
                            headers={"WWW-Authenticate": "Bearer"})
    return usuario


def dispositivo_actual(x_device_key: str = Header(...),
                       db: Session = Depends(get_db)) -> models.Dispositivo:
    disp = db.scalar(select(models.Dispositivo)
                     .where(models.Dispositivo.api_key_hash == hash_api_key(x_device_key)))
    if not disp or not disp.activo:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Collar no autorizado")
    return disp


def mascota_del_usuario(mascota_id: int,
                        usuario: models.Usuario = Depends(usuario_actual),
                        db: Session = Depends(get_db)) -> models.Mascota:
    mascota = db.get(models.Mascota, mascota_id)
    if not mascota or mascota.usuario_id != usuario.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Mascota no encontrada")
    return mascota