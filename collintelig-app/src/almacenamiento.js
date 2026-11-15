import AsyncStorage from '@react-native-async-storage/async-storage';
import { AJUSTES_INICIALES } from './config';

const CLAVE = 'collintelig:ajustes';

export async function cargarAjustes() {
  try {
    const guardado = await AsyncStorage.getItem(CLAVE);
    return guardado ? { ...AJUSTES_INICIALES, ...JSON.parse(guardado) } : AJUSTES_INICIALES;
  } catch {
    return AJUSTES_INICIALES;
  }
}

export async function guardarAjustes(ajustes) {
  await AsyncStorage.setItem(CLAVE, JSON.stringify(ajustes));
}
