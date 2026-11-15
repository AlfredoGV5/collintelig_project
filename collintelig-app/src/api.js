import { mock } from './mock';

const TIEMPO_LIMITE_MS = 8000;

async function pedir(ajustes, ruta, opciones = {}) {
  const base = ajustes.apiUrl.trim().replace(/\/$/, '');
  const control = new AbortController();
  const temporizador = setTimeout(() => control.abort(), TIEMPO_LIMITE_MS);

  try {
    const resp = await fetch(`${base}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
      signal: control.signal,
    });
    if (!resp.ok) throw new Error(`El servidor respondió con error ${resp.status} en ${ruta}`);
    return resp.status === 204 ? null : await resp.json();
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new Error('El servidor no respondió en 8 s. Revisa la URL en Ajustes y que el backend esté encendido.');
    }
    if (e.message?.includes('Network request failed')) {
      throw new Error('No hay conexión con el servidor. Revisa la URL en Ajustes y que el teléfono esté en la misma red.');
    }
    throw e;
  } finally {
    clearTimeout(temporizador);
  }
}

const id = (a) => encodeURIComponent(a.deviceId);

export const api = {
  // { actividad: 0-100, clasificacion: 'reposo'|'caminando'|'corriendo', bateria: 0-100, ultima_lectura: ISO, en_linea: bool }
  estado: (a) => (a.usarDatosDePrueba ? mock.estado() : pedir(a, `/api/dispositivos/${id(a)}/estado`)),

  // [{ timestamp: ISO, actividad: 0-100 }]  (un punto por minuto)
  lecturas: (a, minutos = 60) =>
    a.usarDatosDePrueba ? mock.lecturas(minutos) : pedir(a, `/api/dispositivos/${id(a)}/lecturas?minutos=${minutos}`),

  // [{ id, tipo, severidad: 'alta'|'media'|'baja', mensaje, timestamp: ISO, leida: bool }]
  alertas: (a) => (a.usarDatosDePrueba ? mock.alertas() : pedir(a, `/api/dispositivos/${id(a)}/alertas`)),

  marcarLeida: (a, alertaId) =>
    a.usarDatosDePrueba
      ? mock.marcarLeida(alertaId)
      : pedir(a, `/api/alertas/${encodeURIComponent(alertaId)}`, { method: 'PATCH', body: JSON.stringify({ leida: true }) }),

  salud: (a) => (a.usarDatosDePrueba ? mock.salud() : pedir(a, '/api/salud')),
};
