from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from app.config import settings

TZ_LOCAL = ZoneInfo(settings.ZONA_HORARIA)


def ahora_utc() -> datetime:
    """Fecha y hora actual en UTC, sin tzinfo (así la guarda MySQL)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def a_local(dt_utc: datetime) -> datetime:
    return dt_utc.replace(tzinfo=timezone.utc).astimezone(TZ_LOCAL)


def desde_epoch_ms(ms: int) -> datetime:
    return datetime.fromtimestamp(ms / 1000, tz=timezone.utc).replace(tzinfo=None)


def alinear(dt: datetime, segundos: int) -> datetime:
    """Redondea hacia abajo al múltiplo de 'segundos' (inicio de ventana)."""
    epoch = int(dt.replace(tzinfo=timezone.utc).timestamp())
    return datetime.fromtimestamp(epoch - epoch % segundos, tz=timezone.utc).replace(tzinfo=None)