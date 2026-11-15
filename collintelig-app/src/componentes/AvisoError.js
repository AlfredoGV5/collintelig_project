import { StyleSheet, Text, View } from 'react-native';
import { colores } from '../tema';

export default function AvisoError({ mensaje }) {
  if (!mensaje) return null;
  return (
    <View style={estilos.caja} accessibilityRole="alert">
      <Text style={estilos.texto}>{mensaje}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { backgroundColor: colores.rojoClaro, borderRadius: 10, padding: 12, marginBottom: 12 },
  texto: { color: colores.rojo, fontSize: 14, lineHeight: 20 },
});
