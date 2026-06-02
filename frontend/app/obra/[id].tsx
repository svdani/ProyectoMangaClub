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
        `http://192.168.1.133:3000/obras/${id}/ediciones`,
      );

      const data = await response.json();

      setEdiciones(data);

      if (data.length > 0) {
        setObra({
          ...data[0],

          estado: data[0]?.estado || "SIN ESTADO",
        });

        const token = await AsyncStorage.getItem("token");

        const huecos = await fetch(
          `http://192.168.1.133:3000/coleccion/huecos/${data[0].id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const tomos = await huecos.json();

        const totalPoseidos = tomos.filter(
          (t: any) => t.estado === "poseido",
        ).length;

        setPoseidos(totalPoseidos);
      }
    } catch (error) {
      console.log(error);
    }
  }

  if (!obra) {
    return (
      <View style={styles.loading}>
        <Text
          style={{
            color: "#fff",
          }}
        >
          Cargando...
        </Text>
      </View>
    );
  }

  const porcentaje =
    obra.total_volumenes > 0
      ? Math.round((poseidos / obra.total_volumenes) * 100)
      : 0;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: 40,
      }}
      data={ediciones}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <>
          <Image
            source={{
              uri: obra.portada_url,
            }}
            style={styles.cover}
          />

          <Text style={styles.title}>{obra.nombre_edicion}</Text>

          <Text style={styles.status}>
            {obra?.estado === "FINISHED"
              ? "Terminado"
              : obra?.estado === "RELEASING" || obra?.estado === "ongoing"
                ? "En publicación"
                : obra?.estado === "HIATUS"
                  ? "Hiatus"
                  : obra?.estado === "CANCELLED"
                    ? "Cancelado"
                    : obra?.estado}
          </Text>

          <Text style={styles.progressText}>
            {poseidos}
            {" / "}
            {obra.total_volumenes}
            {" tomos"}
          </Text>

          <Text style={styles.percent}>
            {porcentaje}
            {"% completado"}
          </Text>

          <View style={styles.barBackground}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${porcentaje}%`,
                },
              ]}
            />
          </View>

          <View style={styles.generosContainer}>
            {obra?.obra?.generos?.map((genero: string, index: number) => (
              <View key={index} style={styles.generoTag}>
                <Text style={styles.generoText}>{genero}</Text>
              </View>
            ))}
          </View>

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
                {obra?.descripcion
                  ? obra.descripcion
                      .replace(/<br>/g, "\n")
                      .replace(/<[^>]*>/g, "")
                  : "Sin sinopsis disponible"}
              </Text>
            </View>
          )}

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
              uri: item.portada_url,
            }}
            style={styles.cardCover}
          />

          <View>
            <Text style={styles.name}>{item.nombre_edicion}</Text>

            <Text style={styles.info}>{item.editorial}</Text>

            <Text style={styles.info}>
              {item.total_volumenes}
              {" tomos"}
            </Text>
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
    marginBottom: 30,
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

  status: {
    color: "#f59e0b",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },

  sinopsisHeader: {
    marginTop: 25,
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

  generosContainer: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 12,

    marginTop: 10,

    marginBottom: 30,
  },

  generoTag: {
    backgroundColor: "#18181b",

    borderWidth: 1,

    borderColor: "#27272a",

    paddingHorizontal: 16,

    paddingVertical: 9,

    borderRadius: 999,
  },

  generoText: {
    color: "#e4e4e7",

    fontSize: 13,

    fontWeight: "700",

    letterSpacing: 0.3,
  },
});
