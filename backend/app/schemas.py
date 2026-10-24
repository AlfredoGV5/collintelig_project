from datetime import date, datetime, time, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer

# En la BD las fechas van en UTC sin zona; al mandarlas a la app se marcan con 'Z'
UTCDatetime = Annotated[
    datetime,
    PlainSerializer(lambda d: d.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z"),
                    return_type=str, when_used="json"),
]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- Usuarios ----------
class UsuarioCrear(BaseModel):
    nombre: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class UsuarioOut(ORM):
    id: int
    nombre: str
    email: EmailStr
    creado_en: UTCDatetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class PushTokenIn(BaseModel):
    expo_push_token: str = Field(min_length=10, max_length=255)


# ---------- Mascotas ----------
Sexo = Literal["macho", "hembra"]
Tamano = Literal["pequeno", "mediano", "grande"]


class MascotaCrear(BaseModel):
    nombre: str = Field(min_length=1, max_length=80)
    raza: str | None = Field(default=None, max_length=80)
    sexo: Sexo | None = None
    fecha_nacimiento: date | None = None
    peso_kg: float | None = Field(default=None, gt=0, lt=120)
    tamano: Tamano = "mediano"


class MascotaActualizar(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=80)
    raza: str | None = Field(default=None, max_length=80)
    sexo: Sexo | None = None
    fecha_nacimiento: date | None = None
    peso_kg: float | None = Field(default=None, gt=0, lt=120)
    tamano: Tamano | None = None


class MascotaOut(ORM):
    id: int
    nombre: str
    raza: str | None
    sexo: Sexo | None
    fecha_nacimiento: date | None
    peso_kg: float | None
    tamano: Tamano
    creado_en: UTCDatetime


class Umbrales(ORM):
    inactividad_max_min: int = Field(240, ge=30, le=1440)
    hiperactividad_min: int = Field(30, ge=5, le=240)
    impacto_g: float = Field(4.0, ge=1.5, le=16)
    horario_dia_inicio: time = time(8, 0)
    horario_dia_fin: time = time(21, 0)
    bateria_baja_pct: int = Field(20, ge=5, le=50)
    sin_conexion_min: int = Field(30, ge=5, le=1440)
    sensibilidad_ml: float = Field(0.05, gt=0, le=0.2)


# ---------- Dispositivos ----------
class DispositivoCrear(BaseModel):
    codigo_serie: str = Field(min_length=3, max_length=40)
    mascota_id: int


class DispositivoOut(ORM):
    id: int
    codigo_serie: str
    mascota_id: int | None
    firmware_version: str | None
    frecuencia_hz: int
    bateria_pct: int | None
    ultima_conexion: UTCDatetime | None
    activo: bool


class DispositivoCreado(DispositivoOut):
    api_key: str = Field(description="Se muestra UNA sola vez: cópiala al firmware del collar")


# ---------- Ingesta (lo que manda el collar) ----------
class Muestra(BaseModel):
    t: int = Field(description="Milisegundos desde 1970-01-01 UTC")
    ax: float
    ay: float
    az: float
    gx: float | None = None
    gy: float | None = None
    gz: float | None = None


class LoteLecturas(BaseModel):
    bateria_pct: int | None = Field(default=None, ge=0, le=100)
    firmware_version: str | None = Field(default=None, max_length=20)
    muestras: list[Muestra] = Field(min_length=1, max_length=2000)


class LoteRespuesta(BaseModel):
    recibidas: int


# ---------- Actividad ----------
class VentanaOut(ORM):
    inicio: UTCDatetime
    nivel_actividad: str
    mag_media: float
    mag_std: float
    mag_max: float
    cruces_media: int | None
    score_anomalia: float | None
    es_anomalia: bool


class ResumenDiario(BaseModel):
    fecha: date
    min_reposo: int
    min_ligera: int
    min_moderada: int
    min_intensa: int
    ventanas_anomalas: int
    minutos_registrados: int


class EstadoMascota(BaseModel):
    mascota_id: int
    nombre: str
    nivel_actual: str | None
    ultima_ventana: UTCDatetime | None
    bateria_pct: int | None
    ultima_conexion: UTCDatetime | None
    alertas_sin_leer: int
    modelo_entrenado: bool


# ---------- Alertas y modelo ----------
class AlertaOut(ORM):
    id: int
    mascota_id: int
    tipo: str
    severidad: str
    mensaje: str
    valor: float | None
    ts_evento: UTCDatetime
    leida: bool


class ModeloOut(ORM):
    id: int
    mascota_id: int
    version: int
    algoritmo: str
    n_ventanas_entrenamiento: int
    metricas: dict | None
    activo: bool
    entrenado_en: UTCDatetime