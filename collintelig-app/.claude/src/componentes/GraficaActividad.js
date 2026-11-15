import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../tema';

// Barras simples (una por minuto) sin librerías externas.
export default function GraficaActividad({ lecturas = [] }) {
  if (lecturas.length === 0) {
    return <Text style={estilos.vacio}>Aún no hay lecturas en la última hora.</Text>;
  }
  const promedio = Math.round(lecturas.reduce((s, l) => s + l.actividad, 0) / lecturas.length);

  return (
    <View>
      <View style={estilos.barras}>
        {lecturas.map((l) => (
          <View
            key={l.timestamp}
            style={[
              estilos.barra,
              { height: `${Math.max(3, l.actividad)}%`, backgroundColor: l.actividad >= 80 ? colores.ambar : colores.pino },
            ]}
          />
        ))}
      </View>
      <View style={estilos.eje}>
        <Text style={estilos.ejeTexto}>hace 60 min</Text>
        <Text style={estilos.ejeTexto}>promedio {promedio}</Text>
        <Text style={estilos.ejeTexto}>ahora</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  barras: { height: 110, flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  barra: { flex: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  eje: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  ejeTexto: { fontSize: 12, color: colores.tenue },
  vacio: { color: colores.tenue, paddingVertical: 24, textAlign: 'center' },
});
