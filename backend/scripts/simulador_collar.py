"""
Simulador del collar Collintelig: genera aceleración (g) y giro (°/s) y los envía a la API
igual que lo hará el ESP32.

Ejemplos:
  python scripts/simulador_collar.py --api-key LLAVE --modo historico --dias 2
  python scripts/simulador_collar.py --api-key LLAVE --modo tiempo-real
  python scripts/simulador_collar.py --api-key LLAVE --modo tiempo-real --anomalia impacto
"""
import argparse
import math
import random
import time
from datetime import datetime
from zoneinfo import ZoneInfo

import httpx

TZ = ZoneInfo("America/Mexico_City")

# estado: (frecuencia de la oscilación en Hz, amplitud en g, ruido en g, giro en °/s)
ESTADOS = {
    "reposo":  (0.0, 0.00, 0.010, 3),
    "caminar": (2.0, 0.15, 0.040, 50),
    "trotar":  (2.8, 0.35, 0.060, 100),
    "correr":  (3.5, 0.80, 0.100, 170),
}


def probabilidades(hora: int) -> dict[str, float]:
    """Rutina típica de un perro de casa, por hora local."""
    if hora < 7 or hora >= 23:
        return {"reposo": 0.97, "caminar": 0.03, "trotar": 0.0, "correr": 0.0}
    if 7 <= hora < 9 or 18 <= hora < 20:          # paseos
        return {"reposo": 0.30, "caminar": 0.45, "trotar": 0.15, "correr": 0.10}
    return {"reposo": 0.70, "caminar": 0.22, "trotar": 0.05, "correr": 0.03}


class Collar:
    def __init__(self, hz: int, anomalia: str | None = None):
        self.hz = hz
        self.anomalia = anomalia
        self.estado = "reposo"
        self.restantes = 0
        self.fase = 0.0
        self.desde_impacto = 290 * hz            # primer golpe a los ~10 s

    def _nuevo_estado(self, hora: int) -> tuple[str, int]:
        if self.anomalia == "inactividad":
            return "reposo", 3600
        if self.anomalia == "hiperactividad":
            return "correr", 3600
        if self.anomalia == "nocturno" and (hora < 6 or hora >= 23):
            return random.choice(["trotar", "correr"]), random.randint(120, 600)
        p = probabilidades(hora)
        estado = random.choices(list(p), weights=list(p.values()))[0]
        duracion = random.randint(300, 2400) if estado == "reposo" else random.randint(60, 600)
        return estado, duracion

    def muestra(self, t_seg: float) -> dict:
        hora = datetime.fromtimestamp(t_seg, TZ).hour
        if self.restantes <= 0:
            self.estado, segundos = self._nuevo_estado(hora)
            self.restantes = segundos * self.hz
        self.restantes -= 1

        f, amp, ruido, giro = ESTADOS[self.estado]
        self.fase += 2 * math.pi * f / self.hz
        osc = amp * math.sin(self.fase)
        ax = 0.05 + 0.4 * osc + random.gauss(0, ruido)
        ay = 0.02 + 0.3 * amp * math.cos(self.fase) + random.gauss(0, ruido)
        az = 1.0 + osc + random.gauss(0, ruido)

        if self.anomalia == "impacto":           # golpe de 5-7 g cada 5 minutos
            self.desde_impacto += 1
            if self.desde_impacto >= 300 * self.hz:
                az += random.uniform(5.0, 7.0)
                self.desde_impacto = 0

        return {"t": int(t_seg * 1000), "ax": round(ax, 4), "ay": round(ay, 4),
                "az": round(az, 4), "gx": round(random.gauss(0, giro), 2),
                "gy": round(random.gauss(0, giro), 2), "gz": round(random.gauss(0, giro), 2)}


def enviar(cliente: httpx.Client, args, muestras: list[dict]) -> bool:
    cuerpo = {"bateria_pct": args.bateria, "firmware_version": "sim-1.0", "muestras": muestras}
    for intento in range(3):
        try:
            r = cliente.post(f"{args.url}/ingesta/lecturas", json=cuerpo,
                             headers={"X-Device-Key": args.api_key}, timeout=30)
            if r.status_code == 201:
                return True
            print(f"\n  Error {r.status_code}: {r.text[:200]}")
            return False
        except httpx.HTTPError as error:
            print(f"\n  Reintento {intento + 1}: {error}")
            time.sleep(2)
    return False


def modo_historico(args, collar: Collar, cliente: httpx.Client) -> None:
    fin = time.time() - 60
    t = fin - args.dias * 86400
    lote, enviadas, lotes = [], 0, 0
    while t < fin:
        lote.append(collar.muestra(t))
        t += 1 / args.hz
        if len(lote) >= 1000:
            enviar(cliente, args, lote)
            enviadas += len(lote)
            lotes += 1
            lote = []
            if lotes % 100 == 0:
                print(f"  {enviadas:,} muestras enviadas...")
    if lote:
        enviar(cliente, args, lote)
        enviadas += len(lote)
    print(f"Listo: {enviadas:,} muestras ({args.dias} días a {args.hz} Hz).")


def modo_tiempo_real(args, collar: Collar, cliente: httpx.Client) -> None:
    lote, siguiente = [], time.time()
    print("Enviando en tiempo real cada 2 s (Ctrl+C para detener)")
    while True:
        lote.append(collar.muestra(time.time()))
        if len(lote) >= args.hz * 2:
            print("." if enviar(cliente, args, lote) else "x", end="", flush=True)
            lote = []
        siguiente += 1 / args.hz
        time.sleep(max(0.0, siguiente - time.time()))


if __name__ == "__main__":
    p = argparse.ArgumentParser(description="Simulador del collar Collintelig")
    p.add_argument("--url", default="http://localhost:8000")
    p.add_argument("--api-key", required=True)
    p.add_argument("--modo", choices=["historico", "tiempo-real"], default="tiempo-real")
    p.add_argument("--dias", type=float, default=2)
    p.add_argument("--hz", type=int, default=20)
    p.add_argument("--anomalia", choices=["impacto", "inactividad", "hiperactividad", "nocturno"])
    p.add_argument("--bateria", type=int, default=85)
    args = p.parse_args()

    collar = Collar(args.hz, args.anomalia)
    with httpx.Client() as cliente:
        try:
            if args.modo == "historico":
                modo_historico(args, collar, cliente)
            else:
                modo_tiempo_real(args, collar, cliente)
        except KeyboardInterrupt:
            print("\nSimulación detenida.")