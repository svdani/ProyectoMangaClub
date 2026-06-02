import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";

export default function PerfilScreen() {
  const [email, setEmail] = useState("");

  const [username, setUsername] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [password, setPassword] = useState("");

  const [confirmarPassword, setConfirmarPassword] = useState("");

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch("http://192.168.1.133:3000/usuarios/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      setEmail(data.email || "");

      setUsername(data.username || "");
    } catch (error) {
      console.log(error);
    }
  }

  async function guardarPerfil() {
    try {
      // validar passwords

      if (mostrarPassword && password !== confirmarPassword) {
        Alert.alert("Error", "Las contraseñas no coinciden");

        return;
      }

      const token = await AsyncStorage.getItem("token");

      const response = await fetch("http://192.168.1.133:3000/usuarios/me", {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          username,

          password: mostrarPassword && password ? password : undefined,
        }),
      });

      const data = await response.json();

      Alert.alert("Perfil", data.message);

      setPassword("");

      setConfirmarPassword("");

      setMostrarPassword(false);

      cargarPerfil();
    } catch (error) {
      console.log(error);
    }
  }

  async function logout() {
    await AsyncStorage.removeItem("token");

    router.replace("/");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>

        <TextInput
          value={email}
          editable={false}
          style={styles.disabledInput}
        />

        <Text style={styles.label}>Username</Text>

        {!username && (
          <Text style={styles.warning}>
            Debes elegir un nombre de usuario único
          </Text>
        )}

        <TextInput
          value={username}
          onChangeText={setUsername}
          style={styles.input}
          placeholder="Tu username"
          placeholderTextColor="#666"
        />

        {!mostrarPassword ? (
          <Pressable
            style={styles.changePasswordButton}
            onPress={() => setMostrarPassword(true)}
          >
            <Text style={styles.changePasswordText}>Cambiar contraseña</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.label}>Nueva contraseña</Text>

            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              secureTextEntry
              placeholder="Nueva contraseña"
              placeholderTextColor="#666"
            />

            <Text style={styles.label}>Confirmar contraseña</Text>

            <TextInput
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              style={styles.input}
              secureTextEntry
              placeholder="Repite la contraseña"
              placeholderTextColor="#666"
            />
          </>
        )}

        <Pressable style={styles.saveButton} onPress={guardarPerfil}>
          <Text style={styles.saveText}>Guardar cambios</Text>
        </Pressable>
      </View>

      <Pressable style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginTop: 60,
    marginBottom: 30,
  },

  card: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },

  label: {
    color: "#888",
    marginBottom: 8,
    marginTop: 15,
  },

  warning: {
    color: "#f59e0b",
    marginBottom: 10,
    fontWeight: "bold",
  },

  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    color: "#fff",
  },

  disabledInput: {
    backgroundColor: "#0f0f0f",
    borderRadius: 12,
    padding: 15,
    color: "#666",
  },

  changePasswordButton: {
    marginTop: 20,
    backgroundColor: "#222",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  changePasswordText: {
    color: "#fff",
    fontWeight: "bold",
  },

  saveButton: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 30,
  },

  saveText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  logoutButton: {
    backgroundColor: "#991b1b",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
