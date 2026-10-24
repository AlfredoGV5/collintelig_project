from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    DATABASE_URL: str = "mysql+pymysql://collintelig_app:app_local_123@localhost:3306/collintelig"
    DB_SSL_CA: str = ""

    JWT_SECRET: str = "cambia-esto"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    ZONA_HORARIA: str = "America/Mexico_City"
    HABILITAR_SCHEDULER: bool = True
    PROCESAR_CADA_SEGUNDOS: int = 60
    VENTANA_SEGUNDOS: int = 60
    MARGEN_LOTES_SEGUNDOS: int = 120     # espera a lotes que llegan tarde
    MAX_HORAS_POR_CICLO: int = 6         # evita cargar días enteros en memoria
    RETENCION_LECTURAS_DIAS: int = 7
    MIN_VENTANAS_ENTRENAMIENTO: int = 600  # 10 horas de datos como mínimo
    DIAS_ENTRENAMIENTO: int = 14

    EXPO_PUSH_URL: str = "https://exp.host/--/api/v2/push/send"
    CORS_ORIGINS: str = "*"


settings = Settings()