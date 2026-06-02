import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Stack, useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";

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
      const response = await fetch(process.env.EXPO_PUBLIC_API_URL + `/volumenes/${id}`);
      const data = await response.json();
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

  const imagenes = [tomo.portada_url, ...(tomo.portadas_alternativas || [])].filter(Boolean);

  return (
    <>
      <Stack.Screen options={{ title: tomo.nombre_manga ?? "Tomo" }} />

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Carrusel de portadas */}
        <FlatList
          data={imagenes}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={COVER_WIDTH + 28}
          disableIntervalMomentum
          scrollEnabled={imagenes.length > 1}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingHorizontal: (width - COVER_WIDTH) / 2 }}
          getItemLayout={(_, index) => ({
            length: COVER_WIDTH + 20,
            offset: (COVER_WIDTH + 20) * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={{ width: COVER_WIDTH + 20, alignItems: "center" }}>
              <Image source={{ uri: item }} style={styles.cover} />
            </View>
          )}
        />

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{tomo.nombre_manga}</Text>
          <Text style={styles.subtitle}>Tomo {tomo.numero_tomo}</Text>

          <View style={styles.separator} />

          <InfoRow label="Estado publicación" value={
            tomo.estado_publicacion === "publicado"
              ? "Publicado"
              : tomo.estado_publicacion === "proximamente"
                ? "Próximamente"
                : tomo.estado_publicacion === "no_editado"
                  ? "No editado"
                  : tomo.estado_publicacion ?? "Sin datos"
          } />

          <InfoRow label="Páginas" value={tomo.paginas?.toString() ?? null} />
          <InfoRow label="Precio" value={tomo.precio ? `${tomo.precio} €` : null} />
          <InfoRow label="Capítulos" value={tomo.capitulos?.length ? tomo.capitulos.join(", ") : null} />
          <InfoRow label="ISBN" value={tomo.isbn ?? null} />
        </View>
      </ScrollView>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </>
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
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
  },

  subtitle: {
    color: "#aaa",
    fontSize: 20,
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
    fontSize: 13,
    marginTop: 16,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  value: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "600",
    marginTop: 4,
  },
});
