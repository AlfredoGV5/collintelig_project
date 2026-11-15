import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colores } from '../tema';
import { CLASIFICACION } from '../tipos';

const TAM = 220;
const GROSOR = 16;
const R = (TAM - GROSOR) / 2;
const CIRC = 2 * Math.PI * R;

// Anillo grande con el nivel de actividad actual (0-100). Es el elemento principal de la pantalla de inicio.
export default function MedidorActividad({ valor = 0, clasificacion, enLinea = true }) {
  const v = Math.max(0, Math.min(100, valor));
  const color = !enLinea ? colores.tenue : v >= 80 ? colores.ambar : colores.pino;
  const etiqueta = !enLinea ? 'Collar sin conexión' : CLASIFICACION[clasificacion] ?? '—';

  return (
    <View style={estilos.contenedor} accessibilityLabel={`Actividad ${Math.round(v)} de 100, ${etiqueta}`}>
      <Svg width={TAM} height={TAM}>
        <Circle cx={TAM / 2} cy={TAM / 2} r={R} stroke={colores.linea} strokeWidth={GROSOR} fill="none" />
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
      </Svg>
      <View style={estilos.centro}>
        <Text style={[estilos.numero, { color: enLinea ? colores.tinta : colores.tenue }]}>{enLinea ? Math.round(v) : '—'}</Text>
        <Text style={[estilos.etiqueta, { color }]}>{etiqueta}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { width: TAM, height: TAM, alignSelf: 'center', marginVertical: 8 },
  centro: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 64, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  etiqueta: { fontSize: 17, fontWeight: '600', marginTop: -4 },
});
