// Datos simulados para desarrollar la app antes de tener el collar y el backend listos.
const retraso = (valor) => new Promise((r) => setTimeout(() => r(valor), 300));
const minutosAtras = (m) => new Date(Date.now() - m * 60000).toISOString();

let alertas = [
  { id: 'a3', tipo: 'patron_inusual', severidad: 'media', mensaje: 'Se sacude o rasca más de lo habitual en los últimos 20 minutos.', timestamp: minutosAtras(25), leida: false },
  { id: 'a2', tipo: 'inactividad_prolongada', severidad: 'baja', mensaje: 'Lleva 3 horas sin moverse durante el día.', timestamp: minutosAtras(240), leida: true },
  { id: 'a1', tipo: 'caida_o_golpe', severidad: 'alta', mensaje: 'Se detectó un impacto fuerte seguido de poco movimiento.', timestamp: minutosAtras(1500), leida: true },
];

const NUEVAS = [
  { tipo: 'actividad_excesiva', severidad: 'media', mensaje: 'Actividad muy alta sostenida por más de 15 minutos.' },
  { tipo: 'caida_o_golpe', severidad: 'alta', mensaje: 'Se detectó un impacto fuerte seguido de poco movimiento.' },
  { tipo: 'patron_inusual', severidad: 'baja', mensaje: 'Movimiento nocturno fuera de su rutina.' },
];

let fase = 0;

export const mock = {
  estado() {
    fase += 1;
    const actividad = Math.max(0, Math.min(100, 40 + 35 * Math.sin(fase / 4) + (Math.random() * 16 - 8)));
    return retraso({
      actividad,
      clasificacion: actividad < 20 ? 'reposo' : actividad < 65 ? 'caminando' : 'corriendo',
      bateria: 78,
      ultima_lectura: new Date().toISOString(),
      en_linea: true,
    });
  },

  lecturas(minutos) {
    return retraso(
      Array.from({ length: minutos }, (_, i) => ({
        timestamp: minutosAtras(minutos - 1 - i),
        actividad: Math.round(Math.max(0, Math.min(100, 30 + 28 * Math.sin(i / 6) + Math.random() * 15))),
      }))
    );
  },

  alertas() {
    // ~5 % de probabilidad de generar una alerta nueva en cada consulta, para probar las notificaciones.
    if (Math.random() < 0.05) {
      const base = NUEVAS[Math.floor(Math.random() * NUEVAS.length)];
      alertas = [{ ...base, id: `a${Date.now()}`, timestamp: new Date().toISOString(), leida: false }, ...alertas];
    }
    return retraso(alertas.map((a) => ({ ...a })));
  },

  marcarLeida(alertaId) {
    alertas = alertas.map((a) => (a.id === alertaId ? { ...a, leida: true } : a));
    return retraso(null);
  },

  salud: () => retraso({ ok: true }),
};
