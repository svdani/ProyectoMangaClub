import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEffect, useState } from "react";

import { useLocalSearchParams } from "expo-router";

export default function MangaDetailScreen() {
  const { id } = useLocalSearchParams();

  const [manga, setManga] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarManga();
  }, []);

  async function cargarManga() {
    try {
      const response = await fetch(
        `https://api.mangadex.org/manga/${id}?includes[]=cover_art`,
      );

      const data = await response.json();

      setManga(data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function importarObra() {
    try {
      const response = await fetch("http://192.168.1.133:3000/obras/importar", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          titulo: obtenerTitulo(),

          portada_url: obtenerCover(),

          mangadex_id: manga.id,
        }),
      });

      await response.json();

      Alert.alert("Importado", "Obra guardada en MangaClub");
    } catch (error) {
      console.log(error);

      Alert.alert("Error", "No se pudo importar");
    }
  }

  function obtenerTitulo() {
    return (
      manga.attributes.title.en || Object.values(manga.attributes.title)[0]
    );
  }

  function obtenerDescripcion() {
    return manga.attributes.description.en || "Sin descripción";
  }

  function obtenerCover() {
    const coverRel = manga.relationships.find(
      (rel: any) => rel.type === "cover_art",
    );

    if (!coverRel || !coverRel.attributes) {
      return "https://picsum.photos/300/450";
    }

    return `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Image
        source={{
          uri: obtenerCover(),
        }}
        style={styles.cover}
      />

      <Text style={styles.title}>{obtenerTitulo()}</Text>

      <Text style={styles.info}>Estado: {manga.attributes.status}</Text>

      <Text style={styles.info}>Año: {manga.attributes.year}</Text>

      <Text style={styles.section}>Descripción</Text>

      <Text style={styles.description}>{obtenerDescripcion()}</Text>

      <View style={styles.buttonContainer}>
        <Button title="Importar a MangaClub" onPress={importarObra} />
      </View>
    </ScrollView>
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
    height: 500,
    borderRadius: 15,
    marginTop: 60,
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 15,
  },

  info: {
    color: "#aaa",
    fontSize: 18,
    marginBottom: 5,
  },

  section: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 30,
    marginBottom: 10,
  },

  description: {
    color: "#ddd",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 40,
  },

  buttonContainer: {
    marginTop: 20,
    marginBottom: 80,
  },
});
