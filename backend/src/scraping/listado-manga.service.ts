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

      // Portada
      let portadaUrl: string | undefined;
      $('img').each((_, el) => {
        if (portadaUrl) return;
        const src = $(el).attr('src') ?? '';
        if (src.includes('static.listadomanga.com') && !src.endsWith('.gif')) {
          portadaUrl = src;
        }
      });

      // Tomos
      const tomos: TomoScrapeado[] = [];
      const numerosVistos = new Set<number>();
      let estadoActual: TomoScrapeado['estado'] = 'publicado';

      $('td').each((_, cell) => {
        // Reemplazar etiquetas HTML por espacio para evitar concatenación de nodos
        const rawHtml = $(cell).html() ?? '';
        const texto = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

        if (texto.includes('Números en preparación')) { estadoActual = 'proximamente'; return; }
        if (texto.includes('Números no editados'))    { estadoActual = 'no_editado';   return; }
        if (texto.includes('Pack especial') || texto.includes('sobrecubierta alternativa')) return;
        if (!texto.includes('nº') || !texto.includes('€')) return;

        // nº X seguido de espacio o separador (no dígito) para no capturar páginas pegadas
        const numMatch = texto.match(/nº\s*(\d+)(?!\d)/i);
        if (!numMatch) return;
        const numero = parseInt(numMatch[1], 10);
        if (numerosVistos.has(numero)) return;
        numerosVistos.add(numero);

        const paginasMatch = texto.match(/(\d{2,4})\s*p[áa]ginas/i);
        const precioMatch  = texto.match(/([\d]+,[\d]+)\s*€/);

        // Intentar extraer portada del tomo desde <img> en la misma fila/celda
        const imgEl = $(cell).closest('tr').find('img[src*="static.listadomanga.com"]').first();
        const portadaTomoUrl = imgEl.length ? (imgEl.attr('src') ?? undefined) : undefined;

        const fechaRaw = this.extraerFechaString(texto);
        const fechaPublicacion = fechaRaw ? this.parsearFecha(fechaRaw) : undefined;

        tomos.push({
          numero,
          paginas:        paginasMatch ? parseInt(paginasMatch[1], 10) : null,
          precio:         precioMatch  ? parseFloat(precioMatch[1].replace(',', '.')) : null,
          fecha:          fechaRaw,
          fechaPublicacion,
          estado:         estadoActual,
          portadaTomoUrl,
        });
      });

      tomos.sort((a, b) => a.numero - b.numero);

      return { listadoMangaId: id, titulo, tituloOriginal, autores: [...autores], editorial, portadaUrl, tomos };
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

  /** Devuelve "15 Enero 2024" o "Enero 2024" tal cual — compatible con convertirFechaEspanol() */
  private extraerFechaString(texto: string): string | null {
    const m = texto.match(
      /(\d+\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\s+(\d{4})/i,
    );
    if (!m) return null;
    const dia = m[1] ? m[1].trim() + ' ' : '1 ';
    const mes = m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase();
    return `${dia}${mes} ${m[3]}`;
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
