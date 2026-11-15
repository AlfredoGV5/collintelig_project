import { colores } from './tema';

export const TIPOS = {
  inactividad_prolongada: { titulo: 'Inactividad prolongada', icono: 'bed-outline' },
  actividad_excesiva: { titulo: 'Actividad excesiva', icono: 'flash-outline' },
  caida_o_golpe: { titulo: 'Posible caída o golpe', icono: 'alert-circle-outline' },
  patron_inusual: { titulo: 'Movimiento inusual', icono: 'pulse-outline' },
};

export const SEVERIDAD = {
  alta: { texto: 'Alta', color: colores.rojo, fondo: colores.rojoClaro },
  media: { texto: 'Media', color: colores.ambar, fondo: colores.ambarClaro },
  baja: { texto: 'Baja', color: colores.pino, fondo: colores.pinoClaro },
};

export const CLASIFICACION = {
  reposo: 'En reposo',
  caminando: 'Caminando',
  corriendo: 'Corriendo',
};

export function hace(ts) {
  const seg = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (seg < 60) return 'hace unos segundos';
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
