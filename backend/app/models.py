from datetime import date, datetime, time
from typing import Optional

from sqlalchemy import (JSON, BigInteger, Boolean, Computed, Date, DateTime, Enum, Float,
                        ForeignKey, Integer, Numeric, SmallInteger, String, Time, func)
from sqlalchemy.dialects.mysql import DATETIME as MySQLDateTime
from sqlalchemy.dialects.mysql import LONGBLOB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

NIVELES = ("reposo", "ligera", "moderada", "intensa")
TIPOS_ALERTA = ("inactividad_prolongada", "hiperactividad", "impacto_caida",
                "patron_anomalo", "bateria_baja", "sin_conexion")


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    email: Mapped[str] = mapped_column(String(150), unique=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    expo_push_token: Mapped[str | None] = mapped_column(String(255))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    mascotas: Mapped[list["Mascota"]] = relationship(back_populates="usuario")


class Mascota(Base):
    __tablename__ = "mascotas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id", ondelete="CASCADE"))
    nombre: Mapped[str] = mapped_column(String(80))
    raza: Mapped[str | None] = mapped_column(String(80))
    sexo: Mapped[str | None] = mapped_column(Enum("macho", "hembra", name="sexo"))
    fecha_nacimiento: Mapped[date | None] = mapped_column(Date)
    peso_kg: Mapped[float | None] = mapped_column(Numeric(5, 2, asdecimal=False))
    tamano: Mapped[str] = mapped_column(Enum("pequeno", "mediano", "grande", name="tamano"),
                                        default="mediano")
    foto_url: Mapped[str | None] = mapped_column(String(255))
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    usuario: Mapped[Usuario] = relationship(back_populates="mascotas")
    dispositivo: Mapped[Optional["Dispositivo"]] = relationship(back_populates="mascota")
    umbrales: Mapped[Optional["UmbralesMascota"]] = relationship(
        back_populates="mascota", cascade="all, delete-orphan")


class UmbralesMascota(Base):
    __tablename__ = "umbrales_mascota"

    mascota_id: Mapped[int] = mapped_column(ForeignKey("mascotas.id", ondelete="CASCADE"),
                                            primary_key=True)
    inactividad_max_min: Mapped[int] = mapped_column(SmallInteger, default=240)
    hiperactividad_min: Mapped[int] = mapped_column(SmallInteger, default=30)
    impacto_g: Mapped[float] = mapped_column(Float, default=4.0)
    horario_dia_inicio: Mapped[time] = mapped_column(Time, default=time(8, 0))
    horario_dia_fin: Mapped[time] = mapped_column(Time, default=time(21, 0))
    bateria_baja_pct: Mapped[int] = mapped_column(SmallInteger, default=20)
    sin_conexion_min: Mapped[int] = mapped_column(SmallInteger, default=30)
    sensibilidad_ml: Mapped[float] = mapped_column(Float, default=0.05)

    mascota: Mapped[Mascota] = relationship(back_populates="umbrales")


class Dispositivo(Base):
    __tablename__ = "dispositivos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mascota_id: Mapped[int | None] = mapped_column(
        ForeignKey("mascotas.id", ondelete="SET NULL"), unique=True)
    codigo_serie: Mapped[str] = mapped_column(String(40), unique=True)
    api_key_hash: Mapped[str] = mapped_column(String(64), unique=True)
    firmware_version: Mapped[str | None] = mapped_column(String(20))
    frecuencia_hz: Mapped[int] = mapped_column(SmallInteger, default=20)
    bateria_pct: Mapped[int | None] = mapped_column(SmallInteger)
    ultima_conexion: Mapped[datetime | None] = mapped_column(DateTime)
    procesado_hasta: Mapped[datetime | None] = mapped_column(DateTime)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    mascota: Mapped[Optional[Mascota]] = relationship(back_populates="dispositivo")


class Lectura(Base):
    __tablename__ = "lecturas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    dispositivo_id: Mapped[int] = mapped_column(ForeignKey("dispositivos.id", ondelete="CASCADE"))
    ts: Mapped[datetime] = mapped_column(MySQLDateTime(fsp=3))
    ax: Mapped[float] = mapped_column(Float)
    ay: Mapped[float] = mapped_column(Float)
    az: Mapped[float] = mapped_column(Float)
    gx: Mapped[float | None] = mapped_column(Float)
    gy: Mapped[float | None] = mapped_column(Float)
    gz: Mapped[float | None] = mapped_column(Float)
    magnitud: Mapped[float] = mapped_column(
        Float, Computed("SQRT(ax*ax + ay*ay + az*az)", persisted=True))


class VentanaActividad(Base):
    __tablename__ = "ventanas_actividad"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    dispositivo_id: Mapped[int] = mapped_column(ForeignKey("dispositivos.id", ondelete="CASCADE"))
    mascota_id: Mapped[int | None] = mapped_column(ForeignKey("mascotas.id", ondelete="CASCADE"))
    inicio: Mapped[datetime] = mapped_column(DateTime)
    fin: Mapped[datetime] = mapped_column(DateTime)
    n_muestras: Mapped[int] = mapped_column(SmallInteger)
    mag_media: Mapped[float] = mapped_column(Float)
    mag_std: Mapped[float] = mapped_column(Float)
    mag_min: Mapped[float] = mapped_column(Float)
    mag_max: Mapped[float] = mapped_column(Float)
    mag_p95: Mapped[float] = mapped_column(Float)
    energia: Mapped[float] = mapped_column(Float)
    giro_medio: Mapped[float | None] = mapped_column(Float)
    cruces_media: Mapped[int | None] = mapped_column(SmallInteger)
    nivel_actividad: Mapped[str] = mapped_column(Enum(*NIVELES, name="nivel"))
    score_anomalia: Mapped[float | None] = mapped_column(Float)
    es_anomalia: Mapped[bool] = mapped_column(Boolean, default=False)


class ModeloML(Base):
    __tablename__ = "modelos_ml"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    mascota_id: Mapped[int] = mapped_column(ForeignKey("mascotas.id", ondelete="CASCADE"))
    version: Mapped[int] = mapped_column(Integer)
    algoritmo: Mapped[str] = mapped_column(String(50), default="IsolationForest")
    archivo: Mapped[bytes] = mapped_column(LONGBLOB)
    n_ventanas_entrenamiento: Mapped[int] = mapped_column(Integer)
    parametros: Mapped[dict | None] = mapped_column(JSON)
    metricas: Mapped[dict | None] = mapped_column(JSON)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    entrenado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Alerta(Base):
    __tablename__ = "alertas"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    mascota_id: Mapped[int] = mapped_column(ForeignKey("mascotas.id", ondelete="CASCADE"))
    dispositivo_id: Mapped[int | None] = mapped_column(
        ForeignKey("dispositivos.id", ondelete="SET NULL"))
    tipo: Mapped[str] = mapped_column(Enum(*TIPOS_ALERTA, name="tipo_alerta"))
    severidad: Mapped[str] = mapped_column(Enum("baja", "media", "alta", name="severidad"))
    mensaje: Mapped[str] = mapped_column(String(255))
    valor: Mapped[float | None] = mapped_column(Float)
    ts_evento: Mapped[datetime] = mapped_column(DateTime)
    leida: Mapped[bool] = mapped_column(Boolean, default=False)
    notificada: Mapped[bool] = mapped_column(Boolean, default=False)
    creado_en: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())