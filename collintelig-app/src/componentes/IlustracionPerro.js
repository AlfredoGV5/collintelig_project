import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colores } from '../tema';

// Ilustración original y sencilla de un perrito con collar.
export default function IlustracionPerro({ tamano = 56 }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 100 100">
      <Circle cx="50" cy="50" r="50" fill={colores.miel} />
      <Path d="M24 28 C10 32 10 62 22 68 C31 61 33 40 31 29 Z" fill={colores.cafe} />
      <Path d="M76 28 C90 32 90 62 78 68 C69 61 67 40 69 29 Z" fill={colores.cafe} />
      <Ellipse cx="50" cy="52" rx="26" ry="28" fill="#E8955A" />
      <Ellipse cx="50" cy="66" rx="15" ry="11" fill="#FCE6D2" />
      <Circle cx="40" cy="48" r="3.8" fill={colores.tinta} />
      <Circle cx="60" cy="48" r="3.8" fill={colores.tinta} />
      <Circle cx="41.3" cy="46.7" r="1.2" fill={colores.blanco} />
      <Circle cx="61.3" cy="46.7" r="1.2" fill={colores.blanco} />
      <Ellipse cx="50" cy="61" rx="5" ry="3.6" fill={colores.tinta} />
      <Path
        d="M50 64 L50 68 M50 68 Q45 72 42 69 M50 68 Q55 72 58 69"
        stroke={colores.tinta}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <Path d="M29 79 Q50 90 71 79" stroke={colores.mandarina} strokeWidth="5" strokeLinecap="round" fill="none" />
      <Circle cx="50" cy="87" r="3.6" fill={colores.blanco} />
    </Svg>
  );
}
