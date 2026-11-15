from datetime import timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app import models
from app.config import settings
from app.utils import a_local

VA = models.VentanaActividad
V = settings.VENTANA_SEGUNDOS


def _hubo_alerta(db: Session, mascota_id: int, tipo: str, desde) -> bool:
    total = db.scalar(select(func.count()).select_from(models.Alerta)
                      .where(models.Alerta.mascota_id == mascota_id,
                             models.Alerta.tipo == tipo,
                             models.Alerta.ts_evento >= desde))
    return total > 0


def _crear(db, disp, tipo, severidad, mensaje, ts, valor=None) -> models.Alerta:
    alerta = models.Alerta(mascota_id=disp.mascota_id, dispositivo_id=disp.id, tipo=tipo,
                           severidad=severidad, mensaje=mensaje[:255], ts_evento=ts, valor=valor)
    db.add(alerta)
    db.flush()          # para que la siguiente verificación la vea
    return alerta


def _umbrales(db: Session, disp: models.Dispositivo) -> models.UmbralesMascota:
    u = db.get(models.UmbralesMascota, disp.mascota_id)
    if u is None:
        u = models.UmbralesMascota(mascota_id=disp.mascota_id)
        db.add(u)
        db.flush()
        db.refresh(u)
    return u


def evaluar_reglas(db: Session, disp: models.Dispositivo, ahora,
                   nuevas: list[models.VentanaActividad]) -> list[models.Alerta]:
    u = _umbrales(db, disp)
    nombre = disp.mascota.nombre
    alertas: list[models.Alerta] = []

    # 1) Collar sin conexión (una alerta por episodio)
    if disp.ultima_conexion and ahora - disp.ultima_conexion > timedelta(minutes=u.sin_conexion_min):
        if not _hubo_alerta(db, disp.mascota_id, "sin_conexion", disp.ultima_conexion):
            minutos = int((ahora - disp.ultima_conexion).total_seconds() // 60)
            alertas.append(_crear(db, disp, "sin_conexion", "media",
                                  f"El collar de {nombre} no envía datos desde hace {minutos} min.",
                                  ahora, minutos))
        return alertas      # sin datos frescos no se evalúa lo demás

    # 2) Impacto o posible caída
    for v in nuevas:
        if v.mag_max >= u.impacto_g and not _hubo_alerta(
                db, disp.mascota_id, "impacto_caida", v.inicio - timedelta(minutes=10)):
            severidad = "alta" if v.mag_max >= u.impacto_g * 1.5 else "media"
            alertas.append(_crear(db, disp, "impacto_caida", severidad,
                                  f"Se detectó un impacto de {v.mag_max:.1f} g. Revisa a {nombre}.",
                                  v.inicio, v.mag_max))

    # 3) Inactividad prolongada, solo en horario diurno (no alerta por dormir de noche)
    local = a_local(ahora)
    if u.horario_dia_inicio <= local.time() <= u.horario_dia_fin:
        periodo = timedelta(minutes=u.inactividad_max_min)
        inicio_dia = (local.replace(hour=u.horario_dia_inicio.hour,
                                    minute=u.horario_dia_inicio.minute, second=0, microsecond=0)
                      .astimezone(timezone.utc).replace(tzinfo=None))
        ultima_activa = db.scalar(select(func.max(VA.fin)).where(
            VA.dispositivo_id == disp.id, VA.nivel_actividad != "reposo"))
        inactivo_desde = max(ultima_activa, inicio_dia) if ultima_activa else inicio_dia
        con_datos = db.scalar(select(func.count()).select_from(VA).where(
            VA.dispositivo_id == disp.id, VA.inicio >= ahora - periodo))
        cobertura = con_datos / (periodo.total_seconds() / V)
        if (ahora - inactivo_desde >= periodo and cobertura >= 0.7
                and not _hubo_alerta(db, disp.mascota_id, "inactividad_prolongada", inactivo_desde)):
            minutos = int((ahora - inactivo_desde).total_seconds() // 60)
            alertas.append(_crear(db, disp, "inactividad_prolongada", "media",
                                  f"{nombre} lleva {minutos} min sin actividad en horario diurno.",
                                  ahora, minutos))

    referencia = nuevas[-1].fin if nuevas else ahora

    # 4) Hiperactividad sostenida
    n = max(1, int(u.hiperactividad_min * 60 / V))
    ultimas = db.scalars(select(VA.nivel_actividad).where(VA.dispositivo_id == disp.id)
                         .order_by(VA.inicio.desc()).limit(n)).all()
    if (len(ultimas) == n and all(x == "intensa" for x in ultimas)
            and not _hubo_alerta(db, disp.mascota_id, "hiperactividad",
                                 referencia - timedelta(minutes=u.hiperactividad_min * 2))):
        alertas.append(_crear(db, disp, "hiperactividad", "media",
                              f"{nombre} lleva {u.hiperactividad_min} min de actividad intensa continua.",
                              referencia, u.hiperactividad_min))

    # 5) Patrón anómalo según el modelo (3 de los últimos 5 minutos)
    if nuevas:
        recientes = db.scalars(select(VA.es_anomalia).where(VA.dispositivo_id == disp.id)
                               .order_by(VA.inicio.desc()).limit(5)).all()
        if sum(recientes) >= 3 and not _hubo_alerta(
                db, disp.mascota_id, "patron_anomalo", referencia - timedelta(minutes=30)):
            alertas.append(_crear(db, disp, "patron_anomalo", "media",
                                  f"Movimiento inusual para {nombre} a esta hora.",
                                  referencia, float(sum(recientes))))

    # 6) Batería baja (máximo una cada 12 h)
    if (disp.bateria_pct is not None and disp.bateria_pct <= u.bateria_baja_pct
            and not _hubo_alerta(db, disp.mascota_id, "bateria_baja", ahora - timedelta(hours=12))):
        alertas.append(_crear(db, disp, "bateria_baja", "baja",
                              f"Batería del collar de {nombre} al {disp.bateria_pct} %.",
                              ahora, disp.bateria_pct))

    return alertas