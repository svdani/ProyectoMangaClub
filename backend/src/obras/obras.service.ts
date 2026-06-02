import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Obra } from './obra.entity';

import { Edicion } from '../ediciones/edicion.entity';

import { Volumen } from '../volumenes/volumen.entity';

import { ImportarObraDto } from './dto/importar-obra.dto';


import { ListadoMangaService } from '../scraping/listado-manga.service';
@Injectable()
export class ObrasService {
  constructor(
    @InjectRepository(Obra)
    private obraRepo: Repository<Obra>,

    @InjectRepository(Edicion)
    private edicionRepo: Repository<Edicion>,

    @InjectRepository(Volumen)
    private volumenRepo: Repository<Volumen>,

    
    private listadoMangaService: ListadoMangaService,
  ) {}

  async importarObra(dto: ImportarObraDto) {
    // 1. Upsert atómico — respuesta inmediata
    await this.obraRepo
      .createQueryBuilder()
      .insert()
      .into('obra')
      .values({
        mangadex_id: dto.mangadex_id,
        titulo_es: dto.titulo,
        portada_url: dto.portada_url,
      })
      .orIgnore()
      .execute();

    let obra = await this.obraRepo.findOne({
      where: { mangadex_id: dto.mangadex_id },
    });

    // Crear edición básica si no existe
    let edicion = await this.edicionRepo.findOne({
      where: { obra_id: obra!.id },
    });

    if (!edicion) {
      edicion = await this.edicionRepo.save(
        this.edicionRepo.create({
          obra_id: obra!.id,
          pais: 'ES',
          editorial: 'MangaDex',
          idioma: 'ES',
          nombre_edicion: dto.titulo,
          portada_url: dto.portada_url,
          total_volumenes: dto.total_tomos || 0,
        }),
      );
    }

    // 2. Enriquecimiento en background — no await
    this.enriquecerObra(obra!, edicion, dto).catch((err) =>
      console.error('Error enriqueciendo obra:', err),
    );

    // 3. Responder inmediatamente con la obra
    return obra;
  }

  private async enriquecerObra(obra: Obra, edicion: Edicion, dto: ImportarObraDto) {
    // AniList
    let anilistData: any = null;
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query ($search: String) {
            Media(search: $search, type: MANGA) {
              id title { romaji } status description bannerImage averageScore genres
            }
          }`,
          variables: { search: dto.titulo },
        }),
      });
      const json = await response.json();
      anilistData = json.data?.Media;
    } catch (error) {
      console.log('AniList error:', error);
    }

    const estado = anilistData?.status || dto.estado || 'UNKNOWN';

    obra.titulo_original = anilistData?.title?.romaji;
    obra.estado          = estado;
    obra.anilist_id      = anilistData?.id;
    obra.descripcion     = anilistData?.description;
    obra.banner_url      = anilistData?.bannerImage;
    obra.score           = anilistData?.averageScore;
    obra.generos         = anilistData?.genres || [];
    await this.obraRepo.save(obra);

    // Covers MangaDex
    let covers: any[] = [];
    let offset = 0;
    let total = 0;
    do {
      const response = await fetch(
        `https://api.mangadex.org/cover?manga[]=${dto.mangadex_id}&limit=100&offset=${offset}`,
      );
      const coversData = await response.json();
      total = coversData.total || 0;
      covers = [...covers, ...(coversData.data || [])];
      offset += 100;
    } while (covers.length < total);

    covers.sort((a, b) => {
      const va = Number(a.attributes.volume);
      const vb = Number(b.attributes.volume);
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    });

    // ListadoManga
    const listadoMangaId = await this.listadoMangaService.buscarColeccionPorTitulo(dto.titulo);
    const listadoManga = listadoMangaId
      ? await this.listadoMangaService.obtenerColeccion(listadoMangaId)
      : null;
    const tomosParseados = listadoManga?.tomos || [];
    const numerosListado = tomosParseados.map((t) => t.numero);

    edicion.total_volumenes = numerosListado.length;
    edicion.ultimo_tomo_publicado =
      estado === 'FINISHED'
        ? numerosListado.length
        : numerosListado.filter((n) => {
            const t = tomosParseados.find((t) => t.numero === n);
            return t?.estado === 'publicado';
          }).length;
    await this.edicionRepo.save(edicion);

    // Volúmenes
    for (const numero of numerosListado) {
      const tomoListado = tomosParseados.find((t) => t.numero === numero);

      const coversTomo = covers.filter((c) => {
        const volumenRaw = c.attributes?.volume;
        if (!volumenRaw) return false;
        const numeroBase = parseInt(volumenRaw.toString().split('.')[0]);
        return numeroBase === numero;
      });

      const portadaPrincipal =
        coversTomo.find((c) => c.attributes.volume.toString() === numero.toString()) ||
        coversTomo[0];

      const portada = portadaPrincipal?.attributes?.fileName
        ? `https://uploads.mangadex.org/covers/${dto.mangadex_id}/${portadaPrincipal.attributes.fileName}`
        : dto.portada_url;

      const alternativas = coversTomo
        .filter((c) => c.attributes.volume.toString() !== numero.toString())
        .map((c) =>
          c?.attributes?.fileName
            ? `https://uploads.mangadex.org/covers/${dto.mangadex_id}/${c.attributes.fileName}`
            : null,
        )
        .filter((url): url is string => url !== null);

      let volumen = await this.volumenRepo.findOne({
        where: { edicion_id: edicion.id, numero_tomo: numero },
      });

      const datosVolumen = {
        portada_url: portada,
        portadas_alternativas: alternativas,
        fecha_publicacion: tomoListado?.fecha
          ? this.convertirFechaEspanol(tomoListado.fecha)
          : undefined,
        capitulos: [],
        paginas: tomoListado?.paginas || null,
        precio: tomoListado?.precio || null,
        estado_publicacion: tomoListado?.estado || 'desconocido',
        ultima_actualizacion: new Date(),
      };

      if (volumen) {
        Object.assign(volumen, datosVolumen);
        await this.volumenRepo.save(volumen);
      } else {
        await this.volumenRepo.save(
          this.volumenRepo.create({
            edicion_id: edicion.id,
            numero_tomo: numero,
            isbn: `${obra.id}-${numero}`,
            ...datosVolumen,
          }),
        );
      }
    }
  }

  async buscarPorTitulo(q: string) {
    const qLower = q.toLowerCase();
    return this.obraRepo
      .createQueryBuilder('obra')
      .leftJoinAndSelect('obra.ediciones', 'edicion')
      .where('LOWER(obra.titulo_es) LIKE :contains', { contains: `%${qLower}%` })
      .orWhere('LOWER(obra.titulo_original) LIKE :contains', { contains: `%${qLower}%` })
      // 1 = exacto | 2 = empieza por + corto primero | 3 = contiene
      .orderBy(
        `CASE
          WHEN LOWER(obra.titulo_es) = :exact                THEN 1
          WHEN LOWER(obra.titulo_es) LIKE :startsWith        THEN 2
          ELSE 3
        END`,
        'ASC',
      )
      .addOrderBy('LENGTH(obra.titulo_es)', 'ASC')
      .setParameters({ exact: qLower, startsWith: `${qLower}%` })
      .limit(30)
      .getMany();
  }

  async obtenerObras() {
    return this.obraRepo.find({
      order: {
        creado_en: 'DESC',
      },
    });
  }

  async obtenerEdiciones(
    obraId: string,
  ) {
    const ediciones =
      await this.edicionRepo.find({
        where: {
          obra_id: obraId,
        },

        relations: {
          obra: true,
          volumenes: true,
        },

        order: {
          creado_en: 'DESC',
        },
      });

    for (const edicion of ediciones) {
      if (
        !edicion.ultimo_tomo_publicado ||
        edicion.ultimo_tomo_publicado ===
          0
      ) {
        if (
          edicion.obra?.estado ===
          'FINISHED'
        ) {
          edicion.ultimo_tomo_publicado =
            edicion.total_volumenes;
        } else {
          edicion.ultimo_tomo_publicado =
            Math.max(
              edicion.total_volumenes -
                5,
              1,
            );
        }

        await this.edicionRepo.save(
          edicion,
        );
      }
    }
      
    return ediciones.map(
      (edicion: any) => ({
        id: edicion.id,

        obra_id:
          edicion.obra_id,

        nombre_edicion:
          edicion.nombre_edicion,

        portada_url:
          edicion.portada_url,

        editorial:
          edicion.editorial,

        total_volumenes:
          edicion.total_volumenes,

        tipo: edicion.obra?.tipo || null,

        estado: edicion.obra?.estado || this.inferirEstadoDesdeVolumenes(edicion.volumenes ?? []),

        descripcion:
          edicion.obra
            ?.descripcion ||
          null,

        score:
          edicion.obra
            ?.score || null,

        banner_url:
          edicion.obra
            ?.banner_url ||
          null,

        obra:
          edicion.obra,
      }),
    );
  }

  async obtenerPorMangadex(
    mangadexId: string,
  ) {
    const obra =
      await this.obraRepo.findOne({
        where: {
          mangadex_id:
            mangadexId,
        },
      });

    return obra || null;
  }

  private inferirEstadoDesdeVolumenes(volumenes: any[]): string | null {
    if (!volumenes.length) return null;
    const hoy = new Date();
    const tieneAbiertos = volumenes.some(
      (v) => !v.fecha_publicacion || new Date(v.fecha_publicacion) > hoy,
    );
    return tieneAbiertos ? 'ongoing' : 'completed';
  }

  private convertirFechaEspanol(
  fecha: string,
) {
  const meses: any = {
    Enero: 0,
    Febrero: 1,
    Marzo: 2,
    Abril: 3,
    Mayo: 4,
    Junio: 5,
    Julio: 6,
    Agosto: 7,
    Septiembre: 8,
    Octubre: 9,
    Noviembre: 10,
    Diciembre: 11,
  };

  const partes =
    fecha.split(' ');

  const dia =
    parseInt(partes[0]);

  const mes =
    meses[partes[1]];

  const año =
    parseInt(partes[2]);

  return new Date(
    año,
    mes,
    dia,
  );
}
}