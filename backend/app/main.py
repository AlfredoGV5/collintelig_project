import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.deps import usuario_actual
from app.routers import actividad, alertas, auth, dispositivos, ingesta, mascotas, modelos
from app.services.entrenamiento import reentrenar_todos
from app.services.procesamiento import ciclo_procesamiento, purgar_lecturas_antiguas

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s: %(message)s")
scheduler = BackgroundScheduler(timezone=settings.ZONA_HORARIA)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if settings.HABILITAR_SCHEDULER:
        scheduler.add_job(ciclo_procesamiento, "interval", seconds=settings.PROCESAR_CADA_SEGUNDOS,
                          id="procesar", max_instances=1, coalesce=True)
        scheduler.add_job(purgar_lecturas_antiguas, "cron", hour=3, id="purgar")
        scheduler.add_job(reentrenar_todos, "cron", hour=4, id="reentrenar")
        scheduler.start()
    yield
    if scheduler.running:
        scheduler.shutdown(wait=False)


app = FastAPI(title="Collintelig API", version="0.1.0",
              description="Collar inteligente para perros: actividad y alertas",
              lifespan=lifespan)

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS.split(","),
                   allow_methods=["*"], allow_headers=["*"])

for modulo in (auth, mascotas, dispositivos, ingesta, actividad, alertas, modelos):
    app.include_router(modulo.router)


@app.get("/salud", tags=["Sistema"])
def salud():
    return {"estado": "ok"}


@app.post("/sistema/procesar-ahora", tags=["Sistema"], dependencies=[Depends(usuario_actual)])
def procesar_ahora():
    """Fuerza un ciclo de procesamiento (útil en pruebas)."""
    ciclo_procesamiento()
    return {"estado": "procesado"}