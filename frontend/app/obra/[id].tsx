import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";

import AsyncStorage from "@react-native-async-storage/async-storage";

const TIPO_LABEL: Record<string, string> = {
  manga: "Manga",
  comic_us: "Cómic USA",
  novela_grafica: "Novela Gráfica",
  bd_europea: "BD Europea",
  comic_nacional: "Cómic Nacional",
};

function estadoLabel(estado: string): string {
  const map: Record<string, string> = {
    FINISHED: "Terminado", completed: "Terminado",
    RELEASING: "En publicación", ongoing: "En publicación",
    HIATUS: "Hiatus", hiatus: "Hiatus",
    CANCELLED: "Cancelado", cancelled: "Cancelado",
  };
  return map[estado] ?? estado;
}

function estadoColor(estado: string): string {
  if (estado === "FINISHED" || estado === "completed") return "#4ade80";
  if (estado === "RELEASING" || estado === "ongoing") return "#60a5fa";
  if (estado === "HIATUS" || estado === "hiatus") return "#fb923c";
  if (estado === "CANCELLED" || estado === "cancelled") return "#f87171";
  return "#888";
}

export default function ObraScreen() {
  const { id } = useLocalSearchParams();

  const [ediciones, setEdiciones] = useState<any[]>([]);
  const [obra, setObra] = useState<any>(null);
  const [mostrarSinopsis, setMostrarSinopsis] = useState(false);
  const [poseidos, setPoseidos] = useState(0);

  useEffect(() => {
    cargarEdiciones();
  }, []);

  async function cargarEdiciones() {
    try {
      const response = await fetch(
        process.env.EXPO_PUBLIC_API_URL + `/obras/${id}/ediciones`,
      );
      const data = await response.json();
      setEdiciones(data);

      if (data.length > 0) {
        setObra({
          ...data[0],
          portada_url: data[0].portada_url || data[0].obra?.portada_url || null,
          estado: data[0]?.estado ?? null,
        });

        const token = await AsyncStorage.getItem("token");
        const huecos = await fetch(
          process.env.EXPO_PUBLIC_API_URL + `/coleccion/huecos/${data[0].id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const tomos = await huecos.json();
        setPoseidos(tomos.filter((t: any) => t.estado === "poseido").length);
      }
    } catch (error) {
      console.log(error);
    }
  }

  if (!obra) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#fff" }}>Cargando...</Text>
      </View>
    );
  }

  const porcentaje =
    obra.total_volumenes > 0
      ? Math.round((poseidos / obra.total_volumenes) * 100)
      : 0;

  const generos: string[] = obra?.obra?.generos ?? [];
  const descripcion: string | null = obra?.descripcion || null;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      data={ediciones}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <Image source={{ uri: obra.portada_url }} style={styles.cover} />

          <Text style={styles.title}>{obra.nombre_edicion}</Text>

          {/* Tipo + Estado con estilos diferentes */}
          <View style={styles.metaTags}>
            {obra?.tipo ? (
              <View style={styles.tipoTag}>
                <Text style={styles.tipoTagText}>
                  {TIPO_LABEL[obra.tipo] ?? obra.tipo}
                </Text>
              </View>
            ) : null}
            {obra?.estado ? (
              <View style={[styles.estadoTag, { borderColor: estadoColor(obra.estado) }]}>
                <Text style={[styles.estadoTagText, { color: estadoColor(obra.estado) }]}>
                  {estadoLabel(obra.estado)}
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.progressText}>
            {poseidos} / {obra.total_volumenes} tomos
          </Text>

          <Text style={styles.percent}>{porcentaje}% completado</Text>

          <View style={styles.barBackground}>
            <View style={[styles.barFill, { width: `${porcentaje}%` }]} />
          </View>

          {/* Géneros — solo si hay datos */}
          {generos.length > 0 ? (
            <View style={styles.generosContainer}>
              {generos.map((genero, index) => (
                <View key={index} style={styles.generoTag}>
                  <Text style={styles.generoText}>{genero}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Sinopsis — solo si hay datos */}
          {descripcion ? (
            <>
              <Pressable
                style={styles.sinopsisHeader}
                onPress={() => setMostrarSinopsis(!mostrarSinopsis)}
              >
                <Text style={styles.sinopsisTitle}>Sinopsis</Text>
                <Ionicons
                  name={mostrarSinopsis ? "chevron-up" : "chevron-down"}
                  size={22}
                  color="#fff"
                />
              </Pressable>

              {mostrarSinopsis && (
                <View style={styles.sinopsisBox}>
                  <Text style={styles.sinopsisText}>
                    {descripcion.replace(/<br>/g, "\n").replace(/<[^>]*>/g, "")}
                  </Text>
                </View>
              )}
            </>
          ) : null}

          <Text style={styles.section}>Ediciones</Text>
        </>
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => router.push(`/edicion/${item.id}`)}
        >
          <Image
            source={{
              uri: item.portada_url || item.obra?.portada_url || obra.portada_url,
            }}
            style={styles.cardCover}
          />

          <View>
            <Text style={styles.name}>{item.nombre_edicion}</Text>
            <Text style={styles.info}>{item.editorial}</Text>
            <Text style={styles.info}>{item.total_volumenes} tomos</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },

  cover: {
    width: "100%",
    height: 320,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },

  metaTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 5,
  },

  // Tipo: tag sólido azul/índigo — indica categoría
  tipoTag: {
    backgroundColor: "#312e81",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },

  tipoTagText: {
    color: "#a5b4fc",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  // Estado: solo borde coloreado según el estado
  estadoTag: {
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },

  estadoTagText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  progressText: {
    color: "#fff",
    marginTop: 15,
    fontSize: 18,
  },

  percent: {
    color: "#4ade80",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },

  barBackground: {
    height: 10,
    backgroundColor: "#222",
    borderRadius: 20,
    overflow: "hidden",
    marginTop: 10,
    marginBottom: 20,
  },

  barFill: {
    height: "100%",
    backgroundColor: "#4ade80",
  },

  section: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    marginTop: 10,
  },

  card: {
    flexDirection: "row",
    gap: 15,
    alignItems: "center",
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 15,
    marginBottom: 12,
  },

  cardCover: {
    width: 60,
    height: 90,
    borderRadius: 10,
    backgroundColor: "#1a1a1a",
  },

  name: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  info: {
    color: "#aaa",
    marginTop: 4,
  },

  generosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },

  generoTag: {
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },

  generoText: {
    color: "#e4e4e7",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  sinopsisHeader: {
    marginTop: 15,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sinopsisTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  sinopsisBox: {
    backgroundColor: "#111",
    padding: 15,
    borderRadius: 15,
    marginBottom: 25,
  },

  sinopsisText: {
    color: "#ccc",
    fontSize: 15,
    lineHeight: 24,
  },
});
