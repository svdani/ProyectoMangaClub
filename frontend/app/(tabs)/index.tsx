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

import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { AnimatedCircularProgress } from "react-native-circular-progress";

export default function HomeScreen() {
  const [biblioteca, setBiblioteca] = useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      cargarBiblioteca();
    }, []),
  );

  async function cargarBiblioteca() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL+"/coleccion/biblioteca",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      setBiblioteca(data);
    } catch (error) {
      console.log(error);
    }
  }
  const totalTomos = biblioteca.reduce(
    (acc, obra) => acc + obra.total_tomos,
    0,
  );

  const totalPoseidos = biblioteca.reduce(
    (acc, obra) => acc + obra.tomos_poseidos,
    0,
  );

  const porcentajeGlobal =
    totalTomos > 0 ? Math.round((totalPoseidos / totalTomos) * 100) : 0;

  const completadas = biblioteca.filter(
    (obra) => obra.tomos_poseidos >= obra.total_tomos,
  ).length;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Biblioteca</Text>
      <View style={styles.globalCard}>
        <AnimatedCircularProgress
          size={110}
          width={10}
          fill={porcentajeGlobal}
          tintColor="#4ade80"
          backgroundColor="#222"
          rotation={0}
        >
          {() => (
            <View
              style={{
                alignItems: "center",
              }}
            >
              <Text style={styles.globalPercent}>{porcentajeGlobal}%</Text>

              <Text style={styles.globalNumbers}>
                {totalPoseidos}
                {" / "}
                {totalTomos}
              </Text>
            </View>
          )}
        </AnimatedCircularProgress>

        <View style={styles.globalStats}>
          <View style={styles.statRow}>
            <Text style={styles.globalLabel}>Colecciones activas</Text>

            <Text style={styles.globalInlineValue}>{biblioteca.length}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.globalLabel}>Completadas</Text>

            <Text style={styles.globalInlineValue}>{completadas}</Text>
          </View>

          <View style={styles.statRow}>
            <Text style={styles.globalLabel}>Tomos coleccionados</Text>

            <Text style={styles.globalInlineGreen}>{totalPoseidos}</Text>
          </View>
        </View>
      </View>

      {biblioteca.length === 0 && (
        <Text style={styles.empty}>
          Todavía no tienes tomos en tu colección
        </Text>
      )}
      <Text style={styles.sectionTitle}>Mis comics</Text>
      <FlatList
        numColumns={2}
        columnWrapperStyle={{
          gap: 14,
        }}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        data={biblioteca}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridCard}
            onPress={() => router.push(`/obra/${item.id}`)}
          >
            <Image
              source={{
                uri: item.portada_url,
              }}
              style={styles.gridCover}
            />

            <Text numberOfLines={1} style={styles.gridTitle}>
              {item.titulo_es}
            </Text>

            <View style={styles.gridMeta}>
              {item.tipo ? (
                <View style={styles.tipoTag}>
                  <Text style={styles.tipoTagText}>
                    {{ manga: "Manga", comic_us: "Cómic USA", novela_grafica: "Novela Gráfica", bd_europea: "BD Europea", comic_nacional: "Cómic Nacional" }[item.tipo as string] ?? item.tipo}
                  </Text>
                </View>
              ) : <View />}
              <AnimatedCircularProgress
                size={42}
                width={5}
                fill={item.porcentaje}
                tintColor="#4ade80"
                backgroundColor="#222"
                rotation={0}
              >
                {() => <Text style={styles.gridPercent}>{item.porcentaje}%</Text>}
              </AnimatedCircularProgress>
            </View>

            <Text style={styles.gridInfo}>
              {item.tomos_poseidos} / {item.total_tomos}
            </Text>
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
    padding: 15,
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
    color: "#aaa",
  },

  progress: {
    color: "#4ade80",
    marginTop: 5,
    fontWeight: "bold",
  },

  barBackground: {
    height: 8,
    backgroundColor: "#222",
    borderRadius: 10,
    marginTop: 8,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 10,
  },

  globalCard: {
    backgroundColor: "#111",
    borderRadius: 25,
    padding: 20,
    marginBottom: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 25,
  },

  globalPercent: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  globalNumbers: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },

  globalStats: {
    flex: 1,
    gap: 14,
  },

  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  globalLabel: {
    color: "#666",
    fontSize: 16,
  },

  globalValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  globalSmall: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "600",
  },

  globalInlineValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 17,
  },

  globalInlineGreen: {
    color: "#4ade80",
    fontWeight: "bold",
    fontSize: 17,
  },

  gridCard: {
    width: "48%",
    backgroundColor: "#111",
    borderRadius: 18,
    padding: 10,
    marginBottom: 14,
  },

  gridCover: {
    width: "100%",
    height: 190,
    borderRadius: 14,
    marginBottom: 10,
  },

  gridTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },

  tipoTag: {
    alignSelf: "flex-start",
    backgroundColor: "#312e81",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },

  tipoTagText: {
    color: "#a5b4fc",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  gridMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  gridPercent: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },

  gridInfo: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
  },

  sectionTitle: {
    color: "#888",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    marginLeft: 4,
  },
});
