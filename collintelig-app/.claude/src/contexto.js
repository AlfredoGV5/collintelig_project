import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { cargarAjustes, guardarAjustes } from './almacenamiento';
import { api } from './api';
import { avisar } from './notificaciones';

const Contexto = createContext(null);

export function ProveedorApp({ children }) {
  const [ajustes, setAjustes] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [errorAlertas, setErrorAlertas] = useState(null);
  const conocidas = useRef(null); // ids ya vistos; null = primera carga (no notificar el historial)

  useEffect(() => {
    cargarAjustes().then(setAjustes);
  }, []);

  const actualizarAjustes = useCallback(
    async (cambios) => {
      const nuevos = { ...ajustes, ...cambios };
      await guardarAjustes(nuevos);
      conocidas.current = null;
      setAlertas([]);
      setAjustes(nuevos);
    },
    [ajustes]
  );

  const recargarAlertas = useCallback(async () => {
    if (!ajustes) return;
    try {
      const lista = await api.alertas(ajustes);
      lista.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (conocidas.current) {
        lista.filter((a) => !a.leida && !conocidas.current.has(a.id)).forEach(avisar);
      }
      conocidas.current = new Set(lista.map((a) => a.id));
      setAlertas(lista);
      setErrorAlertas(null);
    } catch (e) {
      setErrorAlertas(e.message);
    }
  }, [ajustes]);

  // Revisión periódica de alertas mientras la app está abierta.
  useEffect(() => {
    if (!ajustes) return;
    recargarAlertas();
    const id = setInterval(recargarAlertas, ajustes.intervaloSeg * 1000);
    return () => clearInterval(id);
  }, [ajustes, recargarAlertas]);

  const marcarLeida = useCallback(
    async (alertaId) => {
      setAlertas((prev) => prev.map((a) => (a.id === alertaId ? { ...a, leida: true } : a)));
      try {
        await api.marcarLeida(ajustes, alertaId);
      } catch (e) {
        setErrorAlertas(e.message);
        recargarAlertas();
      }
    },
    [ajustes, recargarAlertas]
  );

  const sinLeer = alertas.filter((a) => !a.leida).length;

  return (
    <Contexto.Provider value={{ ajustes, actualizarAjustes, alertas, errorAlertas, recargarAlertas, marcarLeida, sinLeer }}>
      {children}
    </Contexto.Provider>
  );
}

export const useApp = () => useContext(Contexto);
