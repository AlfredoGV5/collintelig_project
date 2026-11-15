// Valores iniciales. Se pueden cambiar desde la pantalla Ajustes sin recompilar.
export const AJUSTES_INICIALES = {
  nombrePerro: 'Mi perro',
  // En desarrollo: IP de tu laptop Ubuntu en la red Wi-Fi (ver `hostname -I`).
  // En producción: la URL https de tu backend en la nube.
  apiUrl: 'http://192.168.1.100:8000',
  deviceId: 'collar-001',
  usarDatosDePrueba: true, // true = la app funciona sin backend (datos simulados)
  intervaloSeg: 10, // cada cuánto se consulta el backend
};
