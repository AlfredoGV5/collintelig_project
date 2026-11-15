import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexto';
import { api } from '../api';
import { usePolling } from '../usePolling';
import { colores, espacio, tarjeta } from '../tema';
import { hace } from '../tipos';
import MedidorActividad from '../componentes/MedidorActividad';
import GraficaActividad from '../componentes/GraficaActividad';
import TarjetaAlerta from '../componentes/TarjetaAlerta';
import AvisoError from '../componentes/AvisoError';

export default function PantallaInicio({ navigation }) {
  const { ajustes, alertas, marcarLeida } = useApp();
  const estado = usePolling(() => api.estado(ajustes), ajustes.intervaloSeg * 1000, [ajustes]);
  const lecturas = usePolling(() => api.lecturas(ajustes, 60), 60000, [ajustes]);
  const [refrescando, setRefrescando] = useState(false);

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([estado.recargar(), lecturas.recargar()]);
    setRefrescando(false);
  };

  const e = estado.datos;
  const pendientes = alertas.filter((a) => !a.leida);

  return (
    <ScrollView
      contentContainerStyle={estilos.contenido}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.pino} />}
    >
      {ajustes.usarDatosDePrueba && <Text style={estilos.prueba}>Mostrando datos de prueba. Cámbialo en Ajustes.</Text>}
      <AvisoError mensaje={estado.error} />

      <MedidorActividad valor={e?.actividad ?? 0} clasificacion={e?.clasificacion} enLinea={e?.en_linea ?? false} />

      <View style={estilos.datos}>
        <Dato icono="battery-half-outline" valor={e ? `${e.bateria} %` : '—'} texto="Batería del collar" />
        <Dato icono="time-outline" valor={e ? hace(e.ultima_lectura) : '—'} texto="Última lectura" />
      </View>

      {pendientes.length > 0 && (
        <View style={{ gap: espacio.s }}>
          <Text style={estilos.subtitulo}>Requiere tu atención</Text>
          <TarjetaAlerta alerta={pendientes[0]} onMarcarLeida={marcarLeida} />
          {pendientes.length > 1 && (
            <Text style={estilos.enlace} onPress={() => navigation.navigate('Alertas')}>
              Ver las {pendientes.length} alertas pendientes
            </Text>
          )}
        </View>
      )}

      <View style={[tarjeta, { gap: espacio.m }]}>
        <Text style={estilos.subtitulo}>Actividad de la última hora</Text>
        <AvisoError mensaje={lecturas.error} />
        <GraficaActividad lecturas={lecturas.datos ?? []} />
      </View>
    </ScrollView>
  );
}

function Dato({ icono, valor, texto }) {
  return (
    <View style={[tarjeta, estilos.dato]}>
      <Ionicons name={icono} size={20} color={colores.pino} />
      <Text style={estilos.datoValor}>{valor}</Text>
      <Text style={estilos.datoTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.m, gap: espacio.m, paddingBottom: espacio.l * 2 },
  prueba: { textAlign: 'center', color: colores.ambar, fontSize: 13 },
  datos: { flexDirection: 'row', gap: espacio.m },
  dato: { flex: 1, gap: 4 },
  datoValor: { fontSize: 18, fontWeight: '700', color: colores.tinta },
  datoTexto: { fontSize: 13, color: colores.tenue },
  subtitulo: { fontSize: 17, fontWeight: '700', color: colores.tinta },
  enlace: { color: colores.pino, fontWeight: '600', fontSize: 15 },
});
