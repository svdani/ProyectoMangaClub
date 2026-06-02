import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get("window");

const COVER_WIDTH = width * 0.78;

export default function TomoScreen() {
  const { id } = useLocalSearchParams();

  const [tomo, setTomo] = useState<any>(null);

  useEffect(() => {
    cargarTomo();
  }, []);

  async function cargarTomo() {
    try {
      const response = await fetch(`http://192.168.1.133:3000/volumenes/${id}`);

      const data = await response.json();
      console.log(data);
      setTomo(data);
    } catch (error) {
      console.log(error);
    }
  }

  if (!tomo) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const imagenes = [tomo.portada_url, ...(tomo.portadas_alternativas || [])];

  return (
    <View style={styles.container}>
      {/* swiper */}

      <FlatList
        data={imagenes}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={COVER_WIDTH + 28}
        disableIntervalMomentum
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{
          paddingHorizontal: (width - COVER_WIDTH) / 2,
        }}
        getItemLayout={(_, index) => ({
          length: COVER_WIDTH + 20,

          offset: (COVER_WIDTH + 20) * index,

          index,
        })}
        renderItem={({ item }) => (
          <View
            style={{
              width: COVER_WIDTH + 20,

              alignItems: "center",
            }}
          >
            <Image
              source={{
                uri: item,
              }}
              style={styles.cover}
            />
          </View>
        )}
      />

      {/* info */}

      <View style={styles.info}>
        <Text style={styles.title}>{tomo.nombre_manga}</Text>

        <Text style={styles.subtitle}>Tomo {tomo.numero_tomo}</Text>

        <View style={styles.separator} />

        <Text style={styles.label}>Estado manga</Text>

        <Text style={styles.value}>
          {tomo.estado_manga === "FINISHED"
            ? "Terminado"
            : tomo.estado_manga === "RELEASING"
              ? "En publicación"
              : tomo.estado_manga === "HIATUS"
                ? "Hiatus"
                : tomo.estado_manga === "CANCELLED"
                  ? "Cancelado"
                  : tomo.estado_manga}
        </Text>

        <Text style={styles.label}>Estado publicación</Text>

        <Text style={styles.value}>
          {tomo.estado_publicacion === "publicado"
            ? "Publicado"
            : tomo.estado_publicacion === "proximamente"
              ? "Próximamente"
              : "No editado"}
        </Text>

        <Text style={styles.label}>Páginas</Text>

        <Text style={styles.value}>{tomo.paginas || "Sin datos"}</Text>

        <Text style={styles.label}>Precio</Text>

        <Text style={styles.value}>
          {tomo.precio ? `${tomo.precio} €` : "Sin datos"}
        </Text>

        <Text style={styles.label}>Capítulos</Text>

        <Text style={styles.value}>
          {tomo.capitulos?.join(", ") || "Sin datos"}
        </Text>

        <Text style={styles.label}>ISBN</Text>

        <Text style={styles.value}>{tomo.isbn || "Sin ISBN"}</Text>

        <Text style={styles.label}>Variantes</Text>

        <Text style={styles.value}>
          {tomo.portadas_alternativas?.length} alternativas
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  loading: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#fff",
    fontSize: 20,
  },

  cover: {
    width: COVER_WIDTH,

    height: COVER_WIDTH * 1.45,

    borderRadius: 20,

    marginTop: 25,

    marginBottom: 20,
  },

  info: {
    paddingHorizontal: 25,
    paddingTop: 10,
    paddingBottom: 60,
  },

  title: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    fontSize: 22,
    marginTop: 5,
    marginBottom: 20,
  },

  separator: {
    height: 1,
    backgroundColor: "#222",
    marginBottom: 20,
  },

  label: {
    color: "#777",
    fontSize: 15,
    marginTop: 16,
  },

  value: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 4,
  },
});
