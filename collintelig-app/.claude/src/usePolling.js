import { useCallback, useEffect, useState } from 'react';

// Ejecuta `fn` al montar y luego cada `intervaloMs`. Devuelve datos, error y una función para recargar.
export function usePolling(fn, intervaloMs, deps) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const recargar = useCallback(async () => {
    try {
      setDatos(await fn());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, deps);

  useEffect(() => {
    recargar();
    const id = setInterval(recargar, intervaloMs);
    return () => clearInterval(id);
  }, [recargar, intervaloMs]);

  return { datos, error, cargando, recargar };
}
