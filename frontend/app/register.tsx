import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useState } from "react";

import { router } from "expo-router";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  async function register() {
    try {
      if (password !== confirmPassword) {
        Alert.alert("Error", "Las contraseñas no coinciden");

        return;
      }

      //const response = await fetch("http://192.168.1.133:3000/auth/register", {
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL+"/auth/register", {

        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();
      console.log(data);
      if (data.message === "Usuario registrado") {
        Alert.alert("Cuenta creada", "Ya puedes iniciar sesión");

        router.replace("/login");
      } else {
        Alert.alert("Error", data.message || "No se pudo crear la cuenta");
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Username"
        placeholderTextColor="#666"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        secureTextEntry
        style={styles.input}
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirmar password"
        placeholderTextColor="#666"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <Pressable style={styles.button} onPress={register}>
        <Text style={styles.text}>Crear cuenta</Text>
      </Pressable>

      <Pressable onPress={() => router.replace("/login")}>
        <Text style={styles.link}>Ya tengo cuenta</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    padding: 20,
  },

  title: {
    color: "#fff",
    fontSize: 38,
    fontWeight: "bold",
    marginBottom: 40,
    textAlign: "center",
  },

  input: {
    backgroundColor: "#111",
    borderRadius: 15,
    padding: 15,
    color: "#fff",
    marginBottom: 15,
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },

  text: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  link: {
    color: "#888",
    textAlign: "center",
    marginTop: 25,
  },
});
