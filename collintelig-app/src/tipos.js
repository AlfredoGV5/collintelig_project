import { colores } from './tema';

export const TIPOS = {
  inactividad_prolongada: { titulo: 'Inactividad prolongada', icono: 'bed' },
  actividad_excesiva: { titulo: 'Actividad excesiva', icono: 'flash' },
  caida_o_golpe: { titulo: 'Posible caída o golpe', icono: 'alert-circle' },
  patron_inusual: { titulo: 'Movimiento inusual', icono: 'pulse' },
};

export const SEVERIDAD = {
  alta: { texto: 'Alta', color: colores.rojo, fondo: colores.rojoClaro },
  media: { texto: 'Media', color: colores.mandarinaOscura, fondo: colores.mandarinaClaro },
  baja: { texto: 'Baja', color: colores.verde, fondo: colores.verdeClaro },
};

export const CLASIFICACION = {
  reposo: 'Descansando',
  caminando: 'Caminando',
  corriendo: 'Corriendo',
};

export function hace(ts) {
  const seg = Math.round((Date.now() - new Date(ts).getTime()) / 1000);
  if (seg < 60) return 'Ahora';
  const min = Math.round(seg / 60);
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Hace ${h} h`;
  return new Date(ts).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
