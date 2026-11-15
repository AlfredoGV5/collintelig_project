import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexto';
import { colores, espacio, radio } from '../tema';
import TarjetaAlerta from '../componentes/TarjetaAlerta';
import AvisoError from '../componentes/AvisoError';
import IlustracionPerro from '../componentes/IlustracionPerro';

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
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={estilos.lista}
      ItemSeparatorComponent={() => <View style={{ height: espacio.m }} />}
      refreshControl={<RefreshControl refreshing={refrescando} onRefresh={refrescar} tintColor={colores.mandarina} />}
      ListHeaderComponent={
        <>
          <AvisoError mensaje={errorAlertas} />
          {alertas.length > 0 && (
            <View style={[estilos.resumen, { backgroundColor: sinLeer ? colores.mandarinaClaro : colores.verdeClaro }]}>
              <Ionicons
                name={sinLeer ? 'alert-circle' : 'checkmark-circle'}
                size={22}
                color={sinLeer ? colores.mandarinaOscura : colores.verde}
              />
              <Text style={[estilos.resumenTexto, { color: sinLeer ? colores.mandarinaOscura : colores.verde }]}>
                {sinLeer === 0 ? 'Todo revisado' : sinLeer === 1 ? 'Tienes 1 alerta sin revisar' : `Tienes ${sinLeer} alertas sin revisar`}
              </Text>
            </View>
          )}
        </>
      }
      ListEmptyComponent={
        <View style={estilos.vacio}>
          <IlustracionPerro tamano={110} />
          <Text style={estilos.vacioTitulo}>Sin alertas</Text>
          <Text style={estilos.vacioTexto}>
            Cuando el collar detecte un movimiento fuera de lo normal, aparecerá aquí y recibirás un aviso.
          </Text>
        </View>
      }
      renderItem={({ item }) => <TarjetaAlerta alerta={item} onMarcarLeida={marcarLeida} />}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: espacio.m, paddingBottom: espacio.xl, flexGrow: 1 },
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radio.m,
    marginBottom: espacio.m,
  },
  resumenTexto: { fontSize: 16, fontWeight: '800' },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: espacio.l },
  vacioTitulo: { fontSize: 22, fontWeight: '900', color: colores.tinta, marginTop: 8 },
  vacioTexto: { fontSize: 16, lineHeight: 23, color: colores.tenue, textAlign: 'center' },
});
