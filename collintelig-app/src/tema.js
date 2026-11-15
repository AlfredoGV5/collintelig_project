// Paleta cálida: ciruela profunda para el panel principal, mandarina y miel como acentos.
export const colores = {
  fondo: '#FFF3EC',
  tarjeta: '#FFFFFF',
  tinta: '#3A1E2A',
  tenue: '#7A5A63',
  linea: '#F3DDD3',
  ciruela: '#5A2342',
  ciruelaSuave: '#74385A',
  sobreCiruela: '#F2D3E0', // texto secundario sobre ciruela
  mandarina: '#F26B38',
  mandarinaOscura: '#C4441A', // botones y texto: buen contraste con blanco
  mandarinaClaro: '#FFE3D6',
  miel: '#F7B23B',
  mielClaro: '#FFF0CC',
  cafe: '#8A4B2A',
  rojo: '#D12F3B',
  rojoClaro: '#FDE1E2',
  verde: '#2F8A57',
  verdeClaro: '#DDF2E4',
  blanco: '#FFFFFF',
};

export const espacio = { xs: 4, s: 8, m: 16, l: 24, xl: 32 };
export const radio = { s: 12, m: 20, l: 32 };

export const tarjeta = {
  backgroundColor: colores.tarjeta,
  borderRadius: radio.m,
  padding: espacio.m,
  shadowColor: colores.ciruela,
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};
