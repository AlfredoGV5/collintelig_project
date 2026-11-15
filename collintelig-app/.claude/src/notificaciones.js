import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { TIPOS } from './tipos';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CANAL = 'alertas-collar';

export async function prepararNotificaciones() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Alertas del collar',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 300, 200, 300],
    });
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return true;
  const nuevo = await Notifications.requestPermissionsAsync();
  return nuevo.status === 'granted';
}

export function avisar(alerta) {
  const titulo = TIPOS[alerta.tipo]?.titulo ?? 'Movimiento anómalo';
  return Notifications.scheduleNotificationAsync({
    content: { title: `🐕 ${titulo}`, body: alerta.mensaje, data: { alertaId: alerta.id } },
    trigger: Platform.OS === 'android' ? { channelId: CANAL } : null,
  });
}
