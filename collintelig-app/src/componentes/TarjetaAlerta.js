import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colores, radio, tarjeta } from '../tema';
import { SEVERIDAD, TIPOS, hace } from '../tipos';

export default function TarjetaAlerta({ alerta, onMarcarLeida }) {
  const tipo = TIPOS[alerta.tipo] ?? { titulo: 'Movimiento anómalo', icono: 'help-circle' };
  const sev = SEVERIDAD[alerta.severidad] ?? SEVERIDAD.media;

  return (
    <View style={[tarjeta, estilos.tarjeta, alerta.leida && estilos.leida]}>
      <View style={estilos.fila}>
        <View style={[estilos.icono, { backgroundColor: sev.fondo }]}>
          <Ionicons name={tipo.icono} size={24} color={sev.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.titulo}>{tipo.titulo}</Text>
          <Text style={estilos.meta}>{hace(alerta.timestamp)}</Text>
        </View>
        <View style={[estilos.severidad, { backgroundColor: sev.fondo }]}>
          <Text style={[estilos.severidadTexto, { color: sev.color }]}>{sev.texto}</Text>
        </View>
      </View>

      <Text style={estilos.mensaje}>{alerta.mensaje}</Text>

      {alerta.leida ? (
        <View style={estilos.vista}>
          <Ionicons name="checkmark-circle" size={18} color={colores.verde} />
          <Text style={estilos.vistaTexto}>Revisada</Text>
        </View>
      ) : (
        onMarcarLeida && (
          <Pressable
            onPress={() => onMarcarLeida(alerta.id)}
            style={({ pressed }) => [estilos.boton, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
          >
            <Ionicons name="checkmark" size={18} color={colores.blanco} />
            <Text style={estilos.botonTexto}>Marcar como vista</Text>
          </Pressable>
        )
      )}
    </View>
  );
}

const estilos = StyleSheet.create({
  tarjeta: { gap: 12 },
  leida: { opacity: 0.65 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icono: { width: 48, height: 48, borderRadius: radio.s + 4, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 17, fontWeight: '800', color: colores.tinta },
  meta: { fontSize: 14, color: colores.tenue, marginTop: 2 },
  severidad: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  severidadTexto: { fontSize: 13, fontWeight: '800' },
  mensaje: { fontSize: 16, lineHeight: 23, color: colores.tinta },
  boton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colores.mandarinaOscura,
    borderRadius: radio.s,
    paddingVertical: 12,
  },
  botonTexto: { fontSize: 16, fontWeight: '800', color: colores.blanco },
  vista: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vistaTexto: { fontSize: 14, fontWeight: '700', color: colores.verde },
});
