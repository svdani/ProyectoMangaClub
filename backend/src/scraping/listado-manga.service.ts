// src/scraping/listado-manga.service.ts

import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface CatalogoRef {
  listadoMangaId: string;
  titulo: string;
  url: string;
}

export interface TomoScrapeado {
  numero: number;
  paginas: number | null;
  precio: number | null;
  fecha: string | null;         // "15 Enero 2024"
  fechaPublicacion?: Date;
  estado: 'publicado' | 'proximamente' | 'no_editado';
  portadaTomoUrl?: string;
}

export interface ColeccionDetalle {
  listadoMangaId: string;
  titulo: string;
  tituloOriginal?: string;
  autores: string[];
  editorial?: string;
  portadaUrl?: string;
  sinopsis?: string;
  coleccion?: string;       // demografía/colección (ej: "Shonen Manga")
  tomos: TomoScrapeado[];
}

const BASE = 'https://www.listadomanga.es';
const DELAY_MS = 800;

@Injectable()
export class ListadoMangaService {
  private readonly logger = new Logger(ListadoMangaService.name);

  // ─── Catálogo completo ────────────────────────────────────────────────────
  async obtenerCatalogo(): Promise<CatalogoRef[]> {
    const html = await this.fetchHtml(`${BASE}/lista.php`);
    const $ = cheerio.load(html);
    const refs: CatalogoRef[] = [];

    $('a[href*="coleccion.php?id="]').each((_, el) => {
      const href = $(el).attr('href') ?? '';
      const match = href.match(/id=(\d+)/);
      if (!match) return;
      const titulo = $(el).text().trim();
      if (!titulo) return;
      refs.push({ listadoMangaId: match[1], titulo, url: `${BASE}/${href}` });
    });

    this.logger.log(`Catálogo: ${refs.length} colecciones`);
    return refs;
  }

  // ─── Detalle de una colección ─────────────────────────────────────────────
  async obtenerColeccion(id: string): Promise<ColeccionDetalle | null> {
    try {
      const html = await this.fetchHtml(`${BASE}/coleccion.php?id=${id}`);
      const $ = cheerio.load(html);

      const titulo = $('title').text().replace('Listado Manga · Colección ·', '').trim();

      // Buscar la celda que dice "Título original" y leer la celda adyacente
      let tituloOriginal: string | undefined;
      $('td').each((_, cell) => {
        const texto = $(cell).text().trim();
        if (texto === 'Título original' || texto.startsWith('Título original:')) {
          const siguiente = $(cell).next('td');
          tituloOriginal = siguiente.length
            ? siguiente.text().trim()
            : texto.replace(/^Título original:\s*/i, '').trim() || undefined;
        }
      });

      // Autores
      const autores = new Set<string>();
      $('td').each((_, cell) => {
        const text = $(cell).text();
        if (text.includes('Guion:') || text.includes('Dibujo:')) {
          $(cell).find('a').each((_, a) => { autores.add($(a).text().trim()); });
        }
      });

      // Editorial española
      let editorial: string | undefined;
      $('a[href*="editorial.php"]').each((_, el) => { editorial = $(el).text().trim(); });

      // Colección / demografía (ej: "Shonen Manga")
      let coleccion: string | undefined;
      $('td').each((_, cell) => {
        const texto = $(cell).text().trim();
        if (texto === 'Colección' || texto.startsWith('Colección:')) {
          const siguiente = $(cell).next('td');
          coleccion = siguiente.length
            ? siguiente.text().trim()
            : texto.replace(/^Colección:\s*/i, '').trim() || undefined;
        }
      });

      // Sinopsis — buscar el bloque que sigue a un h2/h3 con "Sinopsis"
      let sinopsis: string | undefined;
      $('h2, h3, h4, b, strong').each((_, el) => {
        if (sinopsis) return;
        const texto = $(el).text().trim().toLowerCase();
        if (texto.startsWith('sinopsis')) {
          // El texto de la sinopsis está en el siguiente párrafo o td
          const siguiente = $(el).next();
          if (siguiente.length) {
            const candidate = siguiente.text().trim();
            if (candidate.length > 20) sinopsis = candidate;
          }
          // O dentro del mismo contenedor padre
          if (!sinopsis) {
            const padre = $(el).parent();
            const todoTexto = padre.text().replace($(el).text(), '').trim();
            if (todoTexto.length > 20) sinopsis = todoTexto;
          }
        }
      });
      // Fallback: buscar td que contenga "Sinopsis" en el label y leer el siguiente
      if (!sinopsis) {
        $('td').each((_, cell) => {
          if (sinopsis) return;
          const texto = $(cell).text().trim();
          if (texto.toLowerCase().startsWith('sinopsis')) {
            const siguiente = $(cell).next('td');
            const candidate = siguiente.length ? siguiente.text().trim() : '';
            if (candidate.length > 20) sinopsis = candidate;
          }
        });
      }

      // Mapa de portadas por número de tomo: alt="Titulo nºX" → src
      // Listadomanga no tiene portada de colección separada — solo imágenes por tomo.
      const portadasPorNumero = new Map<number, string>();
      $('img[src*="static.listadomanga.com"]').each((_, el) => {
        const src = $(el).attr('src') ?? '';
        if (!src || src.endsWith('.gif')) return;
        const alt = $(el).attr('alt') ?? '';
        const altMatch = alt.match(/nº\s*(\d+)/i);
        if (altMatch) {
          portadasPorNumero.set(parseInt(altMatch[1], 10), src);
        }
      });
      // Portada de la obra = imagen del tomo con el número más bajo
      const primerNumero = [...portadasPorNumero.keys()].sort((a, b) => a - b)[0];
      const portadaUrl: string | undefined = primerNumero !== undefined
        ? portadasPorNumero.get(primerNumero)
        : undefined;

      // Tomos
      const tomos: TomoScrapeado[] = [];
      const numerosVistos = new Set<number>();
      let estadoActual: TomoScrapeado['estado'] = 'publicado';

      $('td').each((_, cell) => {
        // Sustituir tags por espacio para evitar concatenación sin separador
        const rawHtml = $(cell).html() ?? '';
        const texto = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        if (texto.includes('Números en preparación')) { estadoActual = 'proximamente'; return; }
        if (texto.includes('Números no editados'))    { estadoActual = 'no_editado';   return; }
        if (texto.includes('Pack especial') || texto.includes('sobrecubierta alternativa')) return;

        // Cada tomo ocupa una celda con su número, páginas, precio y fecha
        const numMatch = texto.match(/nº\s*(\d+)(?!\d)/i);
        if (!numMatch) return;
        const numero = parseInt(numMatch[1], 10);
        if (numerosVistos.has(numero)) return;
        numerosVistos.add(numero);

        const paginasMatch = texto.match(/(\d{2,4})\s*p[áa]ginas/i);
        const precioMatch  = texto.match(/([\d.,]+)\s*€/);
        const fechaRaw = this.extraerFechaString(texto);
        const fechaPublicacion = fechaRaw ? this.parsearFecha(fechaRaw) : undefined;

        tomos.push({
          numero,
          paginas:        paginasMatch ? parseInt(paginasMatch[1], 10) : null,
          precio:         precioMatch  ? parseFloat(precioMatch[1].replace('.', '').replace(',', '.')) : null,
          fecha:          fechaRaw,
          fechaPublicacion,
          estado:         estadoActual,
          portadaTomoUrl: portadasPorNumero.get(numero),
        });
      });

      tomos.sort((a, b) => a.numero - b.numero);

      return { listadoMangaId: id, titulo, tituloOriginal, autores: [...autores], editorial, portadaUrl, sinopsis, coleccion, tomos };
    } catch (err) {
      this.logger.error(`Error obteniendo colección ${id}: ${(err as Error).message}`);
      return null;
    }
  }

  // ─── Búsqueda por título ──────────────────────────────────────────────────
  async buscarColeccionPorTitulo(titulo: string): Promise<string | null> {
    try {
      const url = `${BASE}/buscador.php?buscar=${encodeURIComponent(titulo)}`;
      const html = await this.fetchHtml(url);
      const ids = [...html.matchAll(/coleccion\.php\?id=(\d+)/g)].map((m) => m[1]);
      return ids[0] ?? null;
    } catch {
      return null;
    }
  }

  // ─── Novedades ────────────────────────────────────────────────────────────
  async obtenerNovedades() {
    try {
      const html = await this.fetchHtml(`${BASE}/novedades.php`);
      const $ = cheerio.load(html);
      const resultados: { texto: string; href: string }[] = [];
      $('a[href*="coleccion.php"]').each((_, el) => {
        const texto = $(el).text().trim();
        const href  = $(el).attr('href') ?? '';
        if (texto && href && texto.includes('nº')) resultados.push({ texto, href });
      });
      return resultados;
    } catch {
      return [];
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  private extraerEtiqueta(texto: string, etiqueta: string): string | undefined {
    return texto.match(new RegExp(`${etiqueta}:\\s*([^\\n]+)`, 'i'))?.[1]?.trim();
  }

  /** Devuelve "15 Enero 2024" o "1 Octubre 2002" — día 1 si no hay día explícito */
  private extraerFechaString(texto: string): string | null {
    const m = texto.match(
      /(\d{1,2}\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i,
    );
    if (!m) return null;
    const dia = m[1] ? m[1].trim() : '1';
    const mes = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
    return `${dia} ${mes} ${m[3]}`;
  }

  private parsearFecha(fechaStr: string): Date | undefined {
    const MESES: Record<string, number> = {
      Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
      Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11,
    };
    const partes = fechaStr.trim().split(' ');
    if (partes.length < 3) return undefined;
    const dia  = parseInt(partes[0], 10);
    const mes  = MESES[partes[1]];
    const año  = parseInt(partes[2], 10);
    if (isNaN(dia) || mes === undefined || isNaN(año)) return undefined;
    return new Date(año, mes, dia);
  }

  async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MangaClubBot/1.0)',
        'Accept-Language': 'es-ES,es;q=0.9',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} → ${url}`);
    return res.text();
  }

  sleep(ms = DELAY_MS): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
