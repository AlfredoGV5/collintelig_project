import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexto';
import { colores, espacio } from '../tema';
import TarjetaAlerta from '../componentes/TarjetaAlerta';
import AvisoError from '../componentes/AvisoError';

export default function PantallaAlertas() {
  const { alertas, errorAlertas, recargarAlertas, marcarLeida, sinLeer } = useApp();
  const [refrescando, setRefrescando] = useState(false);

  const refrescar = async () => {
    setRefrescando(true);
    await recargarAlertas();
    setRefrescando(false);
  };

  return (
    <FlatList
      data={alertas}
      keyExtractor={(a) => String(a.id)}
      contentContainerStyle={estilos.lista}
      ItemSeparatorComponent={() => <View style={{ height: espacio.s + 4 }} />}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.pino} />}
      ListHeaderComponent={
        <>
          <AvisoError mensaje={errorAlertas} />
          {alertas.length > 0 && (
            <Text style={estilos.resumen}>
              {sinLeer === 0 ? 'Todo revisado.' : sinLeer === 1 ? '1 alerta sin revisar.' : `${sinLeer} alertas sin revisar.`}
            </Text>
          )}
        </>
      }
      ListEmptyComponent={
        <View style={estilos.vacio}>
          <Ionicons name="checkmark-circle-outline" size={48} color={colores.pino} />
          <Text style={estilos.vacioTitulo}>Sin alertas</Text>
          <Text style={estilos.vacioTexto}>Cuando el collar detecte un movimiento fuera de lo normal, aparecerá aquí y recibirás un aviso.</Text>
        </View>
      }
      renderItem={({ item }) => <TarjetaAlerta alerta={item} onMarcarLeida={marcarLeida} />}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: espacio.m, paddingBottom: espacio.l * 2, flexGrow: 1 },
  resumen: { color: colores.tenue, fontSize: 14, marginBottom: espacio.m },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: espacio.l },
  vacioTitulo: { fontSize: 18, fontWeight: '700', color: colores.tinta },
  vacioTexto: { fontSize: 15, lineHeight: 21, color: colores.tenue, textAlign: 'center' },
});
