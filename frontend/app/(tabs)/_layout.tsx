import { Tabs } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarStyle: {
          backgroundColor: "#000",

          borderTopColor: "#111",

          height: 70,

          paddingBottom: 10,
        },

        tabBarActiveTintColor: "#fff",

        tabBarInactiveTintColor: "#666",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Biblioteca",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
