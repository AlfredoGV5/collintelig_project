import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../contexto';
import { api } from '../api';
import { colores, espacio, radio, tarjeta } from '../tema';
import IlustracionPerro from '../componentes/IlustracionPerro';

export default function PantallaAjustes() {
  const { ajustes, actualizarAjustes } = useApp();
  const [form, setForm] = useState({ ...ajustes, intervaloSeg: String(ajustes.intervaloSeg) });
  const [aviso, setAviso] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [probando, setProbando] = useState(false);

  const cambiar = (campo) => (valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setAviso(null);
  };

  const normalizado = () => ({
    ...form,
    nombrePerro: form.nombrePerro.trim() || 'Mi perro',
    apiUrl: form.apiUrl.trim(),
    deviceId: form.deviceId.trim(),
    intervaloSeg: Math.max(3, parseInt(form.intervaloSeg, 10) || 10),
  });

  const probar = async () => {
    setProbando(true);
    try {
      await api.salud({ ...normalizado(), usarDatosDePrueba: false });
      setAviso({ tipo: 'ok', texto: 'Conexión correcta con el servidor.' });
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message });
    } finally {
      setProbando(false);
    }
  };

  const guardar = async () => {
    const n = normalizado();
    if (!n.usarDatosDePrueba && !/^https?:\/\//.test(n.apiUrl)) {
      setAviso({ tipo: 'error', texto: 'La dirección del servidor debe empezar con http:// o https://' });
      return;
    }
    await actualizarAjustes(n);
    setForm({ ...n, intervaloSeg: String(n.intervaloSeg) });
    setAviso({ tipo: 'ok', texto: 'Cambios guardados.' });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colores.fondo }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={[tarjeta, estilos.perfil]}>
          <IlustracionPerro tamano={64} />
          <View style={{ flex: 1 }}>
            <Text style={estilos.etiqueta}>Nombre de tu perro</Text>
            <TextInput
              value={form.nombrePerro}
              onChangeText={cambiar('nombrePerro')}
              style={[estilos.input, { marginTop: 6 }]}
              placeholder="Ej. Firulais"
              placeholderTextColor={colores.tenue}
            />
          </View>
        </View>

        <Text style={estilos.seccion}>Conexión</Text>

        <View style={[tarjeta, estilos.filaSwitch]}>
          <View style={[estilos.iconoSeccion, { backgroundColor: colores.mielClaro }]}>
            <Ionicons name="flask" size={20} color={colores.cafe} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={estilos.etiqueta}>Usar datos de prueba</Text>
            <Text style={estilos.ayuda}>Para usar la app sin collar ni servidor.</Text>
          </View>
          <Switch
            value={form.usarDatosDePrueba}
            onValueChange={cambiar('usarDatosDePrueba')}
            trackColor={{ true: colores.mandarina, false: colores.linea }}
            thumbColor={colores.blanco}
          />
        </View>

        <View style={[tarjeta, { gap: espacio.m + 4 }]}>
          <Campo etiqueta="Dirección del servidor" ayuda="Ejemplo: https://collintelig.onrender.com" valor={form.apiUrl} onCambio={cambiar('apiUrl')} teclado="url" />
          <Campo etiqueta="Identificador del collar" ayuda="El mismo que tiene programado el ESP32." valor={form.deviceId} onCambio={cambiar('deviceId')} />
          <Campo etiqueta="Revisar cada (segundos)" ayuda="Mínimo 3 segundos." valor={form.intervaloSeg} onCambio={cambiar('intervaloSeg')} teclado="number-pad" />
        </View>

        {aviso && (
          <View style={[estilos.aviso, { backgroundColor: aviso.tipo === 'ok' ? colores.verdeClaro : colores.rojoClaro }]}>
            <Ionicons
              name={aviso.tipo === 'ok' ? 'checkmark-circle' : 'close-circle'}
              size={20}
              color={aviso.tipo === 'ok' ? colores.verde : colores.rojo}
            />
            <Text style={[estilos.avisoTexto, { color: aviso.tipo === 'ok' ? colores.verde : colores.rojo }]}>{aviso.texto}</Text>
          </View>
        )}

        <Boton texto={probando ? 'Probando conexión…' : 'Probar conexión'} onPress={probar} secundario deshabilitado={probando} />
        <Boton texto="Guardar cambios" onPress={guardar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({ etiqueta, ayuda, valor, onCambio, teclado = 'default' }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput
        value={valor}
        onChangeText={onCambio}
        keyboardType={teclado}
        autoCapitalize="none"
        autoCorrect={false}
        style={estilos.input}
        placeholderTextColor={colores.tenue}
      />
      <Text style={estilos.ayuda}>{ayuda}</Text>
    </View>
  );
}

function Boton({ texto, onPress, secundario, deshabilitado }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      style={({ pressed }) => [
        estilos.boton,
        secundario ? estilos.botonSecundario : estilos.botonPrimario,
        (pressed || deshabilitado) && { opacity: 0.7 },
      ]}
    >
      <Text style={[estilos.botonTexto, { color: secundario ? colores.mandarinaOscura : colores.blanco }]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.m, gap: espacio.m, paddingBottom: espacio.xl },
  perfil: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  seccion: { fontSize: 20, fontWeight: '900', color: colores.tinta, marginTop: espacio.s },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconoSeccion: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  etiqueta: { fontSize: 16, fontWeight: '800', color: colores.tinta },
  ayuda: { fontSize: 14, color: colores.tenue },
  input: {
    borderWidth: 1.5,
    borderColor: colores.linea,
    borderRadius: radio.s,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: colores.tinta,
    backgroundColor: colores.fondo,
  },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: radio.s },
  avisoTexto: { flex: 1, fontSize: 15, fontWeight: '600' },
  boton: { borderRadius: radio.s + 2, paddingVertical: 16, alignItems: 'center' },
  botonPrimario: { backgroundColor: colores.mandarinaOscura },
  botonSecundario: { borderWidth: 2, borderColor: colores.mandarinaOscura, backgroundColor: colores.tarjeta },
  botonTexto: { fontSize: 17, fontWeight: '800' },
});
