from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings

connect_args = {}
if settings.DB_SSL_CA:
    connect_args["ssl"] = {"ca": settings.DB_SSL_CA}

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,     # revisa que la conexión siga viva
    pool_recycle=280,       # evita 'MySQL server has gone away'
    connect_args=connect_args,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()