import { useState } from "react";

import { router } from "expo-router";

import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ExploreScreen() {
  const [busqueda, setBusqueda] = useState("");

  const [mangas, setMangas] = useState<any[]>([]);

  async function buscarMangas(texto: string) {
    setBusqueda(texto);

    if (!texto) {
      setMangas([]);

      return;
    }

    try {
      const response = await fetch(
        `https://api.mangadex.org/manga?title=${texto}&limit=10&includes[]=cover_art`,
      );

      const data = await response.json();

      const mangasConTomos = await Promise.all(
        data.data.map(async (manga: any) => {
          let totalTomos = 0;

          try {
            const coversResponse = await fetch(
              `https://api.mangadex.org/cover?manga[]=${manga.id}&limit=100`,
            );

            const coversData = await coversResponse.json();

            const covers = coversData.data || [];

            // obtener números únicos reales

            const numerosUnicos = Array.from(
              new Set(
                covers
                  .map((cover: any) => {
                    const volumenRaw = cover.attributes?.volume;

                    if (!volumenRaw) return null;

                    const texto = volumenRaw.toString();

                    // ignorar variantes
                    // tipo 1.1

                    if (texto.includes(".")) {
                      return null;
                    }

                    const numero = parseInt(texto);

                    return isNaN(numero) ? null : numero;
                  })
                  .filter((n): n is number => n !== null),
              ),
            );

            totalTomos = numerosUnicos.length;
          } catch {
            totalTomos = 0;
          }

          return {
            ...manga,

            totalTomos,
          };
        }),
      );

      setMangas(mangasConTomos);
    } catch (error) {
      console.log(error);
    }
  }

  function obtenerTitulo(manga: any) {
    return (
      manga.attributes.title.en || Object.values(manga.attributes.title)[0]
    );
  }

  function obtenerCover(manga: any) {
    const coverRel = manga.relationships.find(
      (rel: any) => rel.type === "cover_art",
    );

    if (!coverRel || !coverRel.attributes || !coverRel.attributes.fileName) {
      return "https://picsum.photos/200/300";
    }

    const fileName = coverRel.attributes.fileName;

    return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
  }

  async function abrirObra(manga: any) {
    try {
      let response = await fetch(
        `http://192.168.1.133:3000/obras/mangadex/${manga.id}`,
      );

      let obra = null;

      const text = await response.text();

      if (text) {
        obra = JSON.parse(text);
      }

      // importar o refrescar

      response = await fetch("http://192.168.1.133:3000/obras/importar", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          titulo: obtenerTitulo(manga),

          portada_url: obtenerCover(manga),

          mangadex_id: manga.id,

          total_tomos: manga.totalTomos,

          estado: manga.attributes.status,
        }),
      });

      obra = await response.json();

      router.push(`/obra/${obra.id}`);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorar</Text>

      <TextInput
        placeholder="Buscar manga..."
        placeholderTextColor="#888"
        style={styles.input}
        value={busqueda}
        onChangeText={buscarMangas}
      />

      <FlatList
        data={mangas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => abrirObra(item)}>
            <Image
              source={{
                uri: obtenerCover(item),
              }}
              style={styles.cover}
            />

            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.name}>{obtenerTitulo(item)}</Text>

              <Text style={styles.info}>
                Estado:{" "}
                {item.attributes.status === "completed"
                  ? "Terminado"
                  : item.attributes.status === "ongoing"
                    ? "En publicación"
                    : item.attributes.status === "hiatus"
                      ? "Hiatus"
                      : item.attributes.status === "cancelled"
                        ? "Cancelado"
                        : item.attributes.status}
              </Text>

              <Text style={styles.info}>Año: {item.attributes.year}</Text>

              <Text style={styles.info}>Tomos: {item.totalTomos}</Text>
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

  input: {
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#111",
    borderRadius: 10,
    padding: 15,
    color: "#fff",
    marginBottom: 20,
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
});
