import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexto';
import { api } from '../api';
import { usePolling } from '../usePolling';
import { colores, espacio, radio, tarjeta } from '../tema';
import { hace } from '../tipos';
import IlustracionPerro from '../componentes/IlustracionPerro';
import MedidorActividad from '../componentes/MedidorActividad';
import GraficaActividad from '../componentes/GraficaActividad';
import TarjetaAlerta from '../componentes/TarjetaAlerta';
import AvisoError from '../componentes/AvisoError';

export default function PantallaInicio({ navigation }) {
  const { ajustes, alertas, marcarLeida } = useApp();
  const enfocada = useIsFocused();
  const insets = useSafeAreaInsets();
  const estado = usePolling(() => api.estado(ajustes), ajustes.intervaloSeg * 1000, [ajustes]);
  const lecturas = usePolling(() => api.lecturas(ajustes, 60), 60000, [ajustes]);
  const [refrescando, setRefrescando] = useState(false);

  const refrescar = async () => {
    setRefrescando(true);
    await Promise.all([estado.recargar(), lecturas.recargar()]);
    setRefrescando(false);
  };

  const e = estado.datos;
  const enLinea = e?.en_linea ?? false;
  const pendientes = alertas.filter((a) => !a.leida);
  const lista = lecturas.datos ?? [];
  const minutosActivo = lista.filter((l) => l.actividad >= 20).length;
  const pico = lista.length ? Math.max(...lista.map((l) => l.actividad)) : null;

  return (
    <ScrollView
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={{ paddingBottom: espacio.xl }}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.mandarina} />}
    >
      {enfocada && <StatusBar style="light" />}

      {/* Panel principal */}
      <View style={[estilos.hero, { paddingTop: insets.top + espacio.m }]}>
        <View style={[estilos.burbuja, { width: 220, height: 220, top: -70, right: -80 }]} />
        <View style={[estilos.burbuja, { width: 140, height: 140, bottom: 40, left: -60 }]} />

        <View style={estilos.encabezado}>
          <IlustracionPerro tamano={58} />
          <View style={{ flex: 1 }}>
            <Text style={estilos.saludo}>Así va</Text>
            <Text style={estilos.nombre} numberOfLines={1}>
              {ajustes.nombrePerro}
            </Text>
          </View>
          <View style={estilos.conexion}>
            <View style={[estilos.puntoConexion, { backgroundColor: enLinea ? '#7BE0A1' : colores.sobreCiruela }]} />
            <Text style={estilos.conexionTexto}>{enLinea ? 'Conectado' : 'Sin señal'}</Text>
          </View>
        </View>

        <MedidorActividad valor={e?.actividad ?? 0} clasificacion={e?.clasificacion} enLinea={enLinea} />

        <View style={estilos.statsHero}>
          <StatHero icono="battery-half" valor={e ? `${e.bateria}%` : '—'} texto="Batería" />
          <View style={estilos.separador} />
          <StatHero icono="time" valor={e ? hace(e.ultima_lectura) : '—'} texto="Última lectura" />
          <View style={estilos.separador} />
          <StatHero icono="notifications" valor={String(pendientes.length)} texto="Alertas" />
        </View>
      </View>

      <View style={estilos.cuerpo}>
        {ajustes.usarDatosDePrueba && (
          <View style={estilos.prueba}>
            <Ionicons name="flask" size={16} color={colores.cafe} />
            <Text style={estilos.pruebaTexto}>Estás viendo datos de prueba</Text>
          </View>
        )}
        <AvisoError mensaje={estado.error} />

        {pendientes.length > 0 && (
          <View style={{ gap: espacio.s + 4 }}>
            <View style={estilos.filaTitulo}>
              <Text style={estilos.subtitulo}>Requiere tu atención</Text>
              {pendientes.length > 1 && (
                <Text style={estilos.enlace} onPress={() => navigation.navigate('Alertas')}>
                  Ver las {pendientes.length}
                </Text>
              )}
            </View>
            <TarjetaAlerta alerta={pendientes[0]} onMarcarLeida={marcarLeida} />
          </View>
        )}

        <View style={estilos.resumen}>
          <Mosaico icono="paw" fondo={colores.mielClaro} color={colores.cafe} valor={lista.length ? `${minutosActivo} min` : '—'} texto="Activo en la última hora" />
          <Mosaico icono="trending-up" fondo={colores.mandarinaClaro} color={colores.mandarinaOscura} valor={pico ?? '—'} texto="Pico de actividad" />
        </View>

        <View style={[tarjeta, { gap: espacio.m }]}>
          <Text style={estilos.subtitulo}>Actividad de la última hora</Text>
          <AvisoError mensaje={lecturas.error} />
          <GraficaActividad lecturas={lista} />
        </View>
      </View>
    </ScrollView>
  );
}

function StatHero({ icono, valor, texto }) {
  return (
    <View style={estilos.statHero}>
      <Ionicons name={icono} size={18} color={colores.miel} />
      <Text style={estilos.statValor} numberOfLines={1}>
        {valor}
      </Text>
      <Text style={estilos.statTexto}>{texto}</Text>
    </View>
  );
}

function Mosaico({ icono, fondo, color, valor, texto }) {
  return (
    <View style={[tarjeta, estilos.mosaico]}>
      <View style={[estilos.mosaicoIcono, { backgroundColor: fondo }]}>
        <Ionicons name={icono} size={22} color={color} />
      </View>
      <Text style={estilos.mosaicoValor}>{valor}</Text>
      <Text style={estilos.mosaicoTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  hero: {
    backgroundColor: colores.ciruela,
    paddingHorizontal: espacio.m + 4,
    paddingBottom: espacio.l,
    borderBottomLeftRadius: radio.l,
    borderBottomRightRadius: radio.l,
    overflow: 'hidden',
  },
  burbuja: { position: 'absolute', borderRadius: 999, backgroundColor: colores.ciruelaSuave, opacity: 0.45 },
  encabezado: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saludo: { fontSize: 15, color: colores.sobreCiruela },
  nombre: { fontSize: 28, fontWeight: '900', color: colores.blanco, letterSpacing: -0.5 },
  conexion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  puntoConexion: { width: 8, height: 8, borderRadius: 4 },
  conexionTexto: { fontSize: 13, fontWeight: '700', color: colores.blanco },
  statsHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radio.m,
    paddingVertical: 14,
  },
  statHero: { flex: 1, alignItems: 'center', gap: 3, paddingHorizontal: 4 },
  statValor: { fontSize: 17, fontWeight: '800', color: colores.blanco },
  statTexto: { fontSize: 13, color: colores.sobreCiruela },
  separador: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.18)' },
  cuerpo: { padding: espacio.m, gap: espacio.l - 4 },
  prueba: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    backgroundColor: colores.mielClaro,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pruebaTexto: { fontSize: 14, fontWeight: '600', color: colores.cafe },
  filaTitulo: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  subtitulo: { fontSize: 20, fontWeight: '900', color: colores.tinta },
  enlace: { fontSize: 15, fontWeight: '800', color: colores.mandarinaOscura },
  resumen: { flexDirection: 'row', gap: espacio.m },
  mosaico: { flex: 1, gap: 6 },
  mosaicoIcono: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  mosaicoValor: { fontSize: 26, fontWeight: '900', color: colores.tinta },
  mosaicoTexto: { fontSize: 14, color: colores.tenue },
});
