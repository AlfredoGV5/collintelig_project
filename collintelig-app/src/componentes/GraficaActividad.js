import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../tema';

// Barras (una por minuto) sin librerías externas.
export default function GraficaActividad({ lecturas = [] }) {
  if (lecturas.length === 0) {
    return <Text style={estilos.vacio}>Aún no hay lecturas en la última hora.</Text>;
  }

  return (
    <View>
      <View style={estilos.area}>
        <View style={[estilos.guia, { bottom: '80%' }]} />
        <Text style={[estilos.guiaTexto, { bottom: '80%' }]}>Muy alta</Text>
        <View style={estilos.barras}>
          {lecturas.map((l) => (
            <View
              key={l.timestamp}
              style={[
                estilos.barra,
                { height: `${Math.max(4, l.actividad)}%`, backgroundColor: l.actividad >= 80 ? colores.mandarina : colores.miel },
              ]}
            />
          ))}
        </View>
      </View>
      <View style={estilos.eje}>
        <Text style={estilos.ejeTexto}>Hace 60 min</Text>
        <Text style={estilos.ejeTexto}>Ahora</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  area: { height: 130 },
  barras: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  barra: { flex: 1, borderRadius: 3 },
  guia: { position: 'absolute', left: 0, right: 0, borderTopWidth: 1, borderStyle: 'dashed', borderColor: colores.mandarina },
  guiaTexto: { position: 'absolute', right: 0, marginBottom: 2, fontSize: 12, fontWeight: '700', color: colores.mandarinaOscura },
  eje: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  ejeTexto: { fontSize: 13, color: colores.tenue },
  vacio: { color: colores.tenue, paddingVertical: 24, textAlign: 'center', fontSize: 15 },
});
