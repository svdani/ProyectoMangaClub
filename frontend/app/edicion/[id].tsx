import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router, useLocalSearchParams } from "expo-router";

import { Ionicons } from "@expo/vector-icons";

export default function EdicionScreen() {
  const { id } = useLocalSearchParams();

  const [volumenes, setVolumenes] = useState<any[]>([]);

  const [info, setInfo] = useState<any>(null);

  const [coversActivas, setCoversActivas] = useState<any>({});

  useEffect(() => {
    cargarVolumenes();
  }, []);

  async function cargarVolumenes() {
    try {
      const token = await AsyncStorage.getItem("token");

      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL+`/coleccion/huecos/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      setVolumenes(data);

      // portada inicial

      const coversIniciales: any = {};

      data.forEach((vol: any) => {
        coversIniciales[vol.id] = 0;
      });

      setCoversActivas(coversIniciales);

      if (data.length > 0) {
        setInfo({
          nombre: data[0].nombre_manga || data[0].nombre_edicion || "Colección",

          estado: data[0].estado_manga,

          total: data.length,

          poseidos: data.filter((v: any) => v.estado === "poseido").length,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function añadirTodos() {
    try {
      const token = await AsyncStorage.getItem("token");

      for (const volumen of volumenes) {
        await fetch(process.env.EXPO_PUBLIC_API_URL+"/coleccion", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            volumen_id: volumen.id,

            estado: "poseido",
          }),
        });
      }

      cargarVolumenes();
    } catch (error) {
      console.log(error);
    }
  }

  async function actualizarEstado(volumen: any, nuevoEstado?: string) {
    try {
      const token = await AsyncStorage.getItem("token");

      if (!nuevoEstado) {
        await fetch(process.env.EXPO_PUBLIC_API_URL+`/coleccion/${volumen.id}`, {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } else {
        await fetch(process.env.EXPO_PUBLIC_API_URL+"/coleccion", {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            volumen_id: volumen.id,

            estado: nuevoEstado,
          }),
        });
      }

      cargarVolumenes();
    } catch (error) {
      console.log(error);
    }
  }

  function tapTomo(item: any) {
    if (item.estado === "poseido") {
      actualizarEstado(item);

      return;
    }

    actualizarEstado(item, "poseido");
  }

  function toggleWishlist(item: any) {
    if (item.estado === "poseido") {
      return;
    }

    if (item.estado === "wishlist") {
      actualizarEstado(item);

      return;
    }

    actualizarEstado(item, "wishlist");
  }

  // cambiar portada

  function cambiarPortada(item: any) {
    const alternativas = item.portadas_alternativas || [];

    if (alternativas.length === 0) {
      return;
    }

    const total = alternativas.length + 1;

    const actual = coversActivas[item.id] || 0;

    const siguiente = (actual + 1) % total;

    setCoversActivas({
      ...coversActivas,

      [item.id]: siguiente,
    });
  }

  function obtenerPortada(item: any) {
    const alternativas = item.portadas_alternativas || [];

    const index = coversActivas[item.id] || 0;

    if (index === 0) {
      return item.portada_url || "https://picsum.photos/200/300";
    }

    return alternativas[index - 1];
  }

  const porcentaje =
    info && info.total > 0 ? Math.round((info.poseidos / info.total) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.infoBox}>
          <Text style={styles.mangaTitle}>{info?.nombre || "Manga"}</Text>

          <Text style={styles.stats}>
            {info?.poseidos || 0}
            {" / "}
            {info?.total || 0}
            {" tomos"}
          </Text>

          {info?.estado ? (
            <Text style={styles.status}>
              {info.estado === "FINISHED" || info.estado === "completed"
                ? "Terminado"
                : info.estado === "RELEASING" || info.estado === "ongoing"
                  ? "En publicación"
                  : info.estado === "HIATUS" || info.estado === "hiatus"
                    ? "Hiatus"
                    : info.estado === "CANCELLED" || info.estado === "cancelled"
                      ? "Cancelado"
                      : info.estado}
            </Text>
          ) : null}

          <Text style={styles.percent}>
            {porcentaje}
            {"% completado"}
          </Text>
        </View>

        <Pressable style={styles.allButton} onPress={añadirTodos}>
          <Text style={styles.allButtonText}>Añadir todos</Text>
        </Pressable>
      </View>

      <FlatList
        data={volumenes}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={{
          gap: 10,
        }}
        contentContainerStyle={{
          gap: 10,
          paddingBottom: 40,
        }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Pressable
              style={styles.coverPress}
              onPress={() => router.push(`/tomo/${item.id}`)}
              onLongPress={() => cambiarPortada(item)}
            >
              <Image
                source={{
                  uri: obtenerPortada(item),
                }}
                style={styles.cover}
              />

              {/* variantes */}

              {item.portadas_alternativas?.length > 0 && (
                <View style={styles.variantBadge}>
                  <Text style={styles.variantText}>
                    +{item.portadas_alternativas.length}
                  </Text>
                </View>
              )}

              {/* check */}

              <Pressable
                style={styles.checkButton}
                onPress={() => {
                  if (item.estado === "poseido") {
                    actualizarEstado(item);
                  } else {
                    actualizarEstado(item, "poseido");
                  }
                }}
              >
                <Ionicons
                  name={
                    item.estado === "poseido" ? "checkbox" : "square-outline"
                  }
                  size={24}
                  color={item.estado === "poseido" ? "#4ade80" : "#777"}
                />
              </Pressable>
            </Pressable>

            {/* wishlist */}

            {item.estado !== "poseido" && (
              <Pressable
                style={styles.wishButton}
                onPress={() => toggleWishlist(item)}
              >
                <Ionicons
                  name="heart"
                  size={20}
                  color={item.estado === "wishlist" ? "#ec4899" : "#555"}
                />
              </Pressable>
            )}

            <View style={styles.numeroBox}>
              <Text style={styles.numero}>{item.numero_tomo}</Text>
            </View>

            {!item.publicado && (
              <View style={styles.proximamenteBadge}>
                <Text style={styles.proximamenteText}>Próximamente</Text>
              </View>
            )}
          </View>
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

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },

  infoBox: {
    flex: 1,
  },

  mangaTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },

  stats: {
    color: "#aaa",
    fontSize: 18,
  },

  percent: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },

  allButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  allButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  card: {
    width: 105,
    height: 160,
    borderRadius: 15,
    overflow: "hidden",
    position: "relative",
  },

  coverPress: {
    flex: 1,
  },

  cover: {
    width: "100%",
    height: "100%",
  },

  variantBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.85)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  variantText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  checkButton: {
    position: "absolute",

    top: 8,
    left: 8,

    width: 32,
    height: 32,

    borderRadius: 20,

    backgroundColor: "rgba(0,0,0,0.8)",

    justifyContent: "center",

    alignItems: "center",
  },

  wishButton: {
    position: "absolute",

    top: 8,
    right: 8,

    width: 32,
    height: 32,

    borderRadius: 20,

    backgroundColor: "rgba(0,0,0,0.8)",

    justifyContent: "center",

    alignItems: "center",
  },

  numeroBox: {
    position: "absolute",

    bottom: 8,
    right: 8,

    backgroundColor: "rgba(0,0,0,0.8)",

    borderRadius: 10,

    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  numero: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  status: {
    color: "#f59e0b",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 5,
  },

  proximamenteBadge: {
    position: "absolute",

    bottom: 8,

    left: 8,

    backgroundColor: "#f59e0b",

    paddingHorizontal: 10,

    paddingVertical: 4,

    borderRadius: 999,
  },

  proximamenteText: {
    color: "#000",

    fontSize: 11,

    fontWeight: "bold",
  },
});
