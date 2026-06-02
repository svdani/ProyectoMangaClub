import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";

export default function LoginScreen() {
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  async function login() {
    try {
      const response = await fetch("http://192.168.1.133:3000/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!data.access_token) {
        Alert.alert("Error", "Credenciales incorrectas");

        return;
      }

      await AsyncStorage.setItem("token", data.access_token);

      router.replace("/");
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>MangaClub</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#666"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#666"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={styles.button} onPress={login}>
        <Text style={styles.text}>Iniciar sesión</Text>
      </Pressable>

      <Pressable onPress={() => router.push("/register")}>
        <Text style={styles.link}>Crear cuenta</Text>
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
    fontSize: 40,
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
    fontWeight: "bold",
    fontSize: 18,
  },

  link: {
    color: "#888",
    textAlign: "center",
    marginTop: 25,
  },
});
