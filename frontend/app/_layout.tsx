import { Stack, router, useSegments } from "expo-router";

import { useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { ActivityIndicator, View } from "react-native";

export default function RootLayout() {
  const [loading, setLoading] = useState(true);

  const segments = useSegments();

  useEffect(() => {
    comprobarSesion();
  }, [segments]);

  async function comprobarSesion() {
    const token = await AsyncStorage.getItem("token");

    const enAuth = segments[0] === "login" || segments[0] === "register";

    // NO LOGEADO

    if (!token && !enAuth) {
      router.replace("/login");
    }

    // LOGEADO

    if (token && enAuth) {
      router.replace("/");
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#000",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#000",
        },

        headerTintColor: "#fff",

        contentStyle: {
          backgroundColor: "#000",
        },

        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="obra/[id]"
        options={{
          title: "Obra",
        }}
      />

      <Stack.Screen
        name="edicion/[id]"
        options={{
          title: "Tomos",
        }}
      />
    </Stack>
  );
}
