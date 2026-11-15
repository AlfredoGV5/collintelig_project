from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import usuario_actual
from app.security import crear_token, hash_password, verificar_password

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/registro", response_model=schemas.UsuarioOut, status_code=201)
def registro(datos: schemas.UsuarioCrear, db: Session = Depends(get_db)):
    if db.scalar(select(models.Usuario).where(models.Usuario.email == datos.email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "El correo ya está registrado")
    usuario = models.Usuario(nombre=datos.nombre, email=datos.email,
                             password_hash=hash_password(datos.password))
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.post("/login", response_model=schemas.Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # OAuth2 llama 'username' al campo; aquí es el correo
    usuario = db.scalar(select(models.Usuario).where(models.Usuario.email == form.username))
    if not usuario or not verificar_password(form.password, usuario.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Correo o contraseña incorrectos")
    return schemas.Token(access_token=crear_token(usuario.id))


@router.get("/yo", response_model=schemas.UsuarioOut)
def yo(usuario: models.Usuario = Depends(usuario_actual)):
    return usuario


@router.put("/push-token", status_code=204)
def guardar_push_token(datos: schemas.PushTokenIn,
                       usuario: models.Usuario = Depends(usuario_actual),
                       db: Session = Depends(get_db)):
    usuario.expo_push_token = datos.expo_push_token
    db.commit()