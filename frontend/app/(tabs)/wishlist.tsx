import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import React, { useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";

import { useFocusEffect } from "@react-navigation/native";

export default function WishlistScreen() {
  const [wishlist, setWishlist] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      cargarWishlist();
    }, []),
  );

  async function cargarWishlist() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        "http://192.168.1.133:3000/coleccion/wishlist",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      setWishlist(data);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wishlist</Text>

      {wishlist.length === 0 && (
        <Text style={styles.empty}>No tienes mangas en wishlist</Text>
      )}

      <FlatList
        data={wishlist}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/obra/${item.id}`)}
          >
            <Image
              source={{
                uri: item.portada_url,
              }}
              style={styles.cover}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.titulo_es}</Text>

              <Text style={styles.info}>
                {item.tomos_wishlist} tomos en wishlist
              </Text>
            </View>
          </Pressable>
        )}
      />
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
    marginBottom: 20,
  },

  empty: {
    color: "#888",
    fontSize: 18,
    marginTop: 30,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },

  cover: {
    width: 60,
    height: 90,
    borderRadius: 8,
  },

  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },

  info: {
    color: "#f59e0b",
    fontWeight: "bold",
  },
});
