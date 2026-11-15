import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useApp } from '../contexto';
import { api } from '../api';
import { colores, espacio, tarjeta } from '../tema';

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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View style={[tarjeta, estilos.filaSwitch]}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.etiqueta}>Usar datos de prueba</Text>
            <Text style={estilos.ayuda}>Actívalo para usar la app sin collar ni servidor.</Text>
          </View>
          <Switch
            value={form.usarDatosDePrueba}
            onValueChange={cambiar('usarDatosDePrueba')}
            trackColor={{ true: colores.pino, false: colores.linea }}
            thumbColor={colores.tarjeta}
          />
        </View>

        <View style={[tarjeta, { gap: espacio.m }]}>
          <Campo etiqueta="Dirección del servidor" ayuda="Ejemplo: https://collintelig.onrender.com" valor={form.apiUrl} onCambio={cambiar('apiUrl')} teclado="url" />
          <Campo etiqueta="Identificador del collar" ayuda="El mismo que tiene programado el ESP32." valor={form.deviceId} onCambio={cambiar('deviceId')} />
          <Campo etiqueta="Revisar cada (segundos)" ayuda="Mínimo 3 segundos." valor={form.intervaloSeg} onCambio={cambiar('intervaloSeg')} teclado="number-pad" />
        </View>

        {aviso && <Text style={[estilos.aviso, { color: aviso.tipo === 'ok' ? colores.pino : colores.rojo }]}>{aviso.texto}</Text>}

        <Boton texto={probando ? 'Probando conexión…' : 'Probar conexión'} onPress={probar} secundario deshabilitado={probando} />
        <Boton texto="Guardar cambios" onPress={guardar} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Campo({ etiqueta, ayuda, valor, onCambio, teclado = 'default' }) {
  return (
    <View style={{ gap: 4 }}>
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
        (pressed || deshabilitado) && { opacity: 0.6 },
      ]}
    >
      <Text style={[estilos.botonTexto, { color: secundario ? colores.pino : colores.tarjeta }]}>{texto}</Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  contenido: { padding: espacio.m, gap: espacio.m, paddingBottom: espacio.l * 2 },
  filaSwitch: { flexDirection: 'row', alignItems: 'center', gap: espacio.m },
  etiqueta: { fontSize: 15, fontWeight: '600', color: colores.tinta },
  ayuda: { fontSize: 13, color: colores.tenue },
  input: { borderWidth: 1, borderColor: colores.linea, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: colores.tinta, backgroundColor: colores.fondo },
  aviso: { fontSize: 14, textAlign: 'center' },
  boton: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  botonPrimario: { backgroundColor: colores.pino },
  botonSecundario: { borderWidth: 1.5, borderColor: colores.pino },
  botonTexto: { fontSize: 16, fontWeight: '700' },
});
