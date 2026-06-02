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

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ExploreScreen() {
  const [busqueda, setBusqueda] = useState("");
  const [obras, setObras] = useState<any[]>([]);

  async function buscarObras(texto: string) {
    setBusqueda(texto);

    if (!texto) {
      setObras([]);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/obras/buscar?q=${encodeURIComponent(texto)}`);
      const data = await response.json();
      setObras(data);
    } catch (error) {
      console.log("Error buscando obras:", error);
    }
  }

  function obtenerPortada(obra: any): string {
    return obra.portada_url || "https://picsum.photos/200/300";
  }

  function obtenerTotalTomos(obra: any): number {
    if (!obra.ediciones || obra.ediciones.length === 0) return 0;
    return obra.ediciones[0].total_volumenes || 0;
  }

  function obtenerEstadoLabel(estado: string): string {
    const map: Record<string, string> = {
      FINISHED: "Terminado",
      RELEASING: "En publicación",
      NOT_YET_RELEASED: "No publicado",
      CANCELLED: "Cancelado",
      HIATUS: "Hiatus",
      completed: "Terminado",
      ongoing: "En publicación",
      hiatus: "Hiatus",
      cancelled: "Cancelado",
    };
    return map[estado] || estado || "Desconocido";
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Explorar</Text>

      <TextInput
        placeholder="Buscar manga..."
        placeholderTextColor="#888"
        style={styles.input}
        value={busqueda}
        onChangeText={buscarObras}
      />

      <FlatList
        data={obras}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => router.push(`/obra/${item.id}`)}>
            <Image
              source={{ uri: obtenerPortada(item) }}
              style={styles.cover}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.titulo_es}</Text>
              {item.titulo_original ? (
                <Text style={styles.infoSecondary}>{item.titulo_original}</Text>
              ) : null}
              <Text style={styles.info}>Estado: {obtenerEstadoLabel(item.estado)}</Text>
              <Text style={styles.info}>Tomos: {obtenerTotalTomos(item)}</Text>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          busqueda.length > 0 ? (
            <Text style={styles.empty}>Sin resultados en la base de datos</Text>
          ) : null
        }
      />
    </View>
  );
}

// ─── Búsqueda MangaDex (guardada para uso futuro / importar obras nuevas) ───
//
// async function buscarEnMangadex(texto: string) {
//   const response = await fetch(
//     `https://api.mangadex.org/manga?title=${texto}&limit=10&includes[]=cover_art`
//   );
//   const data = await response.json();
//   const mangasConTomos = await Promise.all(
//     data.data.map(async (manga: any) => {
//       let totalTomos = 0;
//       try {
//         const coversResponse = await fetch(
//           `https://api.mangadex.org/cover?manga[]=${manga.id}&limit=100`
//         );
//         const coversData = await coversResponse.json();
//         const covers = coversData.data || [];
//         const numerosUnicos = Array.from(
//           new Set(
//             covers
//               .map((cover: any) => {
//                 const volumenRaw = cover.attributes?.volume;
//                 if (!volumenRaw) return null;
//                 const texto = volumenRaw.toString();
//                 if (texto.includes(".")) return null;
//                 const numero = parseInt(texto);
//                 return isNaN(numero) ? null : numero;
//               })
//               .filter((n): n is number => n !== null)
//           )
//         );
//         totalTomos = numerosUnicos.length;
//       } catch { totalTomos = 0; }
//       return { ...manga, totalTomos };
//     })
//   );
//   return mangasConTomos;
// }
//
// async function abrirObraMangadex(manga: any) {
//   const url = `${API_URL}/obras/mangadex/${manga.id}`;
//   let response = await fetch(url);
//   response = await fetch(`${API_URL}/obras/importar`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({
//       titulo: obtenerTituloMangadex(manga),
//       portada_url: obtenerCoverMangadex(manga),
//       mangadex_id: manga.id,
//       total_tomos: manga.totalTomos,
//       estado: manga.attributes.status,
//     }),
//   });
//   const obra = await response.json();
//   if (obra?.id) router.push(`/obra/${obra.id}`);
// }
//
// function obtenerTituloMangadex(manga: any) {
//   return manga.attributes.title.en || Object.values(manga.attributes.title)[0];
// }
//
// function obtenerCoverMangadex(manga: any) {
//   const coverRel = manga.relationships.find((rel: any) => rel.type === "cover_art");
//   if (!coverRel?.attributes?.fileName) return "https://picsum.photos/200/300";
//   return `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}`;
// }

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
    marginBottom: 3,
  },

  infoSecondary: {
    color: "#888",
    fontSize: 13,
    marginBottom: 3,
  },

  info: {
    color: "#aaa",
  },

  empty: {
    color: "#555",
    textAlign: "center",
    marginTop: 40,
  },
});
