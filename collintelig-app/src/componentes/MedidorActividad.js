import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colores } from '../tema';
import { CLASIFICACION } from '../tipos';

const TAM = 210;
const GROSOR = 18;
const R = (TAM - GROSOR) / 2;
const CIRC = 2 * Math.PI * R;

// Anillo de actividad (0-100) pensado para ir sobre el panel color ciruela.
export default function MedidorActividad({ valor = 0, clasificacion, enLinea = true }) {
  const v = Math.max(0, Math.min(100, valor));
  const color = v >= 80 ? colores.mandarina : colores.miel;
  const etiqueta = !enLinea ? 'Sin conexión' : CLASIFICACION[clasificacion] ?? '—';

  return (
    <View style={estilos.contenedor} accessibilityLabel={`Actividad ${Math.round(v)} de 100, ${etiqueta}`}>
      <Svg width={TAM} height={TAM}>
        <Circle cx={TAM / 2} cy={TAM / 2} r={R} stroke={colores.ciruelaSuave} strokeWidth={GROSOR} fill="none" />
        {enLinea && (
          <Circle
            cx={TAM / 2}
            cy={TAM / 2}
            r={R}
            stroke={color}
            strokeWidth={GROSOR}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${CIRC} ${CIRC}`}
            strokeDashoffset={CIRC * (1 - v / 100)}
            transform={`rotate(-90 ${TAM / 2} ${TAM / 2})`}
          />
        )}
      </Svg>
      <View style={estilos.centro}>
        <Text style={estilos.numero}>{enLinea ? Math.round(v) : '—'}</Text>
        <Text style={estilos.escala}>de 100</Text>
        <View style={[estilos.chip, { backgroundColor: enLinea ? color : colores.ciruelaSuave }]}>
          <Text style={estilos.chipTexto}>{etiqueta}</Text>
        </View>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { width: TAM, height: TAM, alignSelf: 'center', marginVertical: 12 },
  centro: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 66, fontWeight: '900', color: colores.blanco, letterSpacing: -2, fontVariant: ['tabular-nums'], lineHeight: 70 },
  escala: { fontSize: 14, color: colores.sobreCiruela, marginTop: -2 },
  chip: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  chipTexto: { fontSize: 15, fontWeight: '800', color: colores.tinta },
});
