import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, tarjeta } from '../tema';
import { SEVERIDAD, TIPOS, hace } from '../tipos';

export default function TarjetaAlerta({ alerta, onMarcarLeida }) {
  const tipo = TIPOS[alerta.tipo] ?? { titulo: 'Movimiento anómalo', icono: 'help-circle-outline' };
  const sev = SEVERIDAD[alerta.severidad] ?? SEVERIDAD.media;

  return (
    <View style={[estilos.tarjeta, alerta.leida && estilos.leida]}>
      <View style={[estilos.franja, { backgroundColor: sev.color }]} />
      <View style={estilos.cuerpo}>
        <View style={estilos.fila}>
          <View style={[estilos.icono, { backgroundColor: sev.fondo }]}>
            <Ionicons name={tipo.icono} size={20} color={sev.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.titulo}>{tipo.titulo}</Text>
            <Text style={estilos.meta}>
              Severidad {sev.texto.toLowerCase()}, {hace(alerta.timestamp)}
            </Text>
          </View>
          {!alerta.leida && <View style={[estilos.punto, { backgroundColor: sev.color }]} />}
        </View>
        <Text style={estilos.mensaje}>{alerta.mensaje}</Text>
        {!alerta.leida && onMarcarLeida && (
          <Pressable
            onPress={() => onMarcarLeida(alerta.id)}
            style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.6 }]}
            accessibilityRole="button"
          >
            <Text style={estilos.botonTexto}>Marcar como vista</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { ...tarjeta, padding: 0, flexDirection: 'row', overflow: 'hidden' },
  leida: { opacity: 0.7 },
  franja: { width: 5 },
  cuerpo: { flex: 1, padding: 14, gap: 8 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icono: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 16, fontWeight: '700', color: colores.tinta },
  meta: { fontSize: 13, color: colores.tenue, marginTop: 1 },
  punto: { width: 10, height: 10, borderRadius: 5 },
  mensaje: { fontSize: 15, lineHeight: 21, color: colores.tinta },
  boton: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: colores.linea },
  botonTexto: { fontSize: 14, fontWeight: '600', color: colores.pino },
});
