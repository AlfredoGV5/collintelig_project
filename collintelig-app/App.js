import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import { ProveedorApp, useApp } from './src/contexto';
import { prepararNotificaciones } from './src/notificaciones';
import { colores } from './src/tema';
import PantallaInicio from './src/pantallas/PantallaInicio';
import PantallaAlertas from './src/pantallas/PantallaAlertas';
import PantallaAjustes from './src/pantallas/PantallaAjustes';

const Tabs = createBottomTabNavigator();
const ICONOS = {
  Inicio: ['paw', 'paw-outline'],
  Alertas: ['notifications', 'notifications-outline'],
  Ajustes: ['settings', 'settings-outline'],
};

function Navegacion() {
  const { ajustes, sinLeer } = useApp();

  if (!ajustes) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.mandarina} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Tabs.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: colores.fondo },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          headerTitleStyle: { color: colores.tinta, fontWeight: '900', fontSize: 26 },
          sceneStyle: { backgroundColor: colores.fondo },
          tabBarActiveTintColor: colores.mandarinaOscura,
          tabBarInactiveTintColor: colores.tenue,
          tabBarLabelStyle: { fontSize: 13, fontWeight: '700' },
          tabBarStyle: { backgroundColor: colores.tarjeta, borderTopColor: colores.linea },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={ICONOS[route.name][focused ? 0 : 1]} size={size + 2} color={color} />
          ),
        })}
      >
        <Tabs.Screen name="Inicio" component={PantallaInicio} options={{ headerShown: false }} />
        <Tabs.Screen
          name="Alertas"
          component={PantallaAlertas}
          options={{ tabBarBadge: sinLeer > 0 ? sinLeer : undefined, tabBarBadgeStyle: { backgroundColor: colores.rojo } }}
        />
        <Tabs.Screen name="Ajustes" component={PantallaAjustes} />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  useEffect(() => {
    prepararNotificaciones();
  }, []);

  return (
    <SafeAreaProvider>
      <ProveedorApp>
        <StatusBar style="dark" />
        <Navegacion />
      </ProveedorApp>
    </SafeAreaProvider>
  );
}
