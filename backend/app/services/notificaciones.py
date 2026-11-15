import logging

import httpx
from sqlalchemy.orm import Session

from app import models
from app.config import settings

log = logging.getLogger("collintelig.push")

TITULOS = {
    "inactividad_prolongada": "Inactividad prolongada",
    "hiperactividad": "Actividad intensa sostenida",
    "impacto_caida": "Posible caída o golpe",
    "patron_anomalo": "Comportamiento inusual",
    "bateria_baja": "Batería baja del collar",
    "sin_conexion": "Collar sin conexión",
}


def enviar_push_alerta(db: Session, alerta: models.Alerta) -> None:
    mascota = db.get(models.Mascota, alerta.mascota_id)
    token = mascota.usuario.expo_push_token if mascota else None
    if not token:
        return
    mensaje = {
        "to": token,
        "title": f"{mascota.nombre}: {TITULOS.get(alerta.tipo, 'Alerta')}",
        "body": alerta.mensaje,
        "sound": "default",
        "priority": "high" if alerta.severidad == "alta" else "default",
        "data": {"alerta_id": alerta.id, "mascota_id": mascota.id, "tipo": alerta.tipo},
    }
    try:
        respuesta = httpx.post(settings.EXPO_PUSH_URL, json=mensaje, timeout=10)
        respuesta.raise_for_status()
        alerta.notificada = True
        db.commit()
    except httpx.HTTPError as error:
        log.warning("No se pudo enviar el push de la alerta %s: %s", alerta.id, error)