// Paleta: verdes de pino (calma, "todo bien") y ámbar/rojo solo para lo que requiere atención.
export const colores = {
  fondo: '#EEF2F0',
  tarjeta: '#FFFFFF',
  tinta: '#1B2A24',
  tenue: '#5B6B64',
  linea: '#D5DDD9',
  pino: '#2F6B4F',
  pinoClaro: '#DCEBE2',
  ambar: '#C97A1E',
  ambarClaro: '#FBEBD5',
  rojo: '#B42318',
  rojoClaro: '#FBE3E1',
};

export const espacio = { xs: 4, s: 8, m: 16, l: 24 };

export const tarjeta = {
  backgroundColor: colores.tarjeta,
  borderRadius: 14,
  padding: espacio.m,
  borderWidth: 1,
  borderColor: colores.linea,
};
