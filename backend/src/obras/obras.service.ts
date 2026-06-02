import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Obra } from './obra.entity';

import { Edicion } from '../ediciones/edicion.entity';

import { Volumen } from '../volumenes/volumen.entity';

import { ImportarObraDto } from './dto/importar-obra.dto';

import { ScrapingService } from '../scraping/scraping.service';
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

    private scrapingService: ScrapingService,
    
    private listadoMangaService: ListadoMangaService,
  ) {}

  async importarObra(
    dto: ImportarObraDto,
  ) {
    
    //await this.listadoMangaService.obtenerNovedades();
    // Upsert atómico — evita duplicate key en llamadas concurrentes
    await this.obraRepo
      .createQueryBuilder()
      .insert()
      .into('obra')
      .values({ mangadex_id: dto.mangadex_id, titulo_es: dto.titulo, portada_url: dto.portada_url })
      .orIgnore()  // si ya existe, no hace nada
      .execute();

    let obra = await this.obraRepo.findOne({ where: { mangadex_id: dto.mangadex_id } });

    // =========================
    // AniList
    // =========================

    let anilistData: any =
      null;

    try {
      const response =
        await fetch(
          'https://graphql.anilist.co',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              query: `
              query ($search: String) {
                Media(
                  search: $search,
                  type: MANGA
                ) {
                  id

                  title {
                    romaji
                  }

                  status

                  description

                  bannerImage

                  averageScore

                  genres
                }
              }
            `,

              variables: {
                search:
                  dto.titulo,
              },
            }),
          },
        );

      const json =
        await response.json();

      anilistData =
        json.data?.Media;

      console.log(
        'ANILIST:',
        dto.titulo,
        anilistData,
      );
    } catch (error) {
      console.log(error);
    }

    // =========================
    // Estado
    // =========================

    const estado =
      anilistData?.status ||
      dto.estado ||
      'UNKNOWN';

    console.log(
      'ESTADO FINAL:',
      dto.titulo,
      estado,
    );
    
    const ivrea =
      await this.scrapingService.buscarIvrea(
        dto.titulo,
      );

    console.log(
      'IVREA RESULTADO:',
      ivrea,
    );

    const norma =
      await this.scrapingService.buscarNorma(
        dto.titulo,
      );

    console.log(
      'NORMA RESULTADO:',
      norma,
    );

    const planeta =
      await this.scrapingService.buscarPlaneta(
        dto.titulo,
      );

    console.log(
      'PLANETA RESULTADO:',
      planeta,
    );

    // =========================
    // Actualizar obra (siempre existe por el upsert de arriba)
    // =========================

    obra!.titulo_es        = dto.titulo;
    obra!.titulo_original  = anilistData?.title?.romaji;
    obra!.portada_url      = dto.portada_url;
    obra!.mangadex_id      = dto.mangadex_id;
    obra!.estado           = estado as any;
    obra!.anilist_id       = anilistData?.id;
    obra!.descripcion      = anilistData?.description;
    obra!.banner_url       = anilistData?.bannerImage;
    obra!.score            = anilistData?.averageScore;
    obra!.generos          = anilistData?.genres || [];

    await this.obraRepo.save(obra!);

    // =========================
    // Buscar edición
    // =========================

    let edicion =
      await this.edicionRepo.findOne(
        {
          where: {
            obra_id: obra!.id,
          },
        },
      );

    // =========================
    // Crear edición
    // =========================

    if (!edicion) {
      edicion =
        await this.edicionRepo.save(
          this.edicionRepo.create({
            obra_id: obra!.id,

            pais: 'ES',

            editorial:
              'MangaDex',

            idioma: 'ES',

            nombre_edicion:
              dto.titulo,

            portada_url:
              dto.portada_url,

            total_volumenes:
              dto.total_tomos ||
              0,
          }),
        );
    }

    // =========================
    // Obtener covers
    // =========================

    let covers: any[] = [];

    let offset = 0;

    let total = 0;

    do {
      const response =
        await fetch(
          `https://api.mangadex.org/cover?manga[]=${dto.mangadex_id}&limit=100&offset=${offset}`,
        );

      const coversData =
        await response.json();

      total =
        coversData.total || 0;

      covers = [
        ...covers,
        ...(coversData.data ||
          []),
      ];
      console.log(
  'COVERS RAW:',
  covers.map((c) => ({
    volume:
      c.attributes?.volume,

    version:
      c.attrinubutes?.version,

    locale:
      c.attributes?.locale,

    description:
      c.attributes
        ?.description,

    file:
      c.attributes?.fileName,
  })),
);

      offset += 100;
    } while (
      covers.length < total
    );

    // =========================
    // Ordenar covers
    // =========================

    covers.sort((a, b) => {
      const va = Number(
        a.attributes.volume,
      );

      const vb = Number(
        b.attributes.volume,
      );

      if (isNaN(va))
        return 1;

      if (isNaN(vb))
        return -1;

      return va - vb;
    });

    // =========================
    // Obtener números únicos
    // =========================

    const numerosUnicos =
      Array.from(
        new Set(
          covers
            .map((cover) => {
              const volumenRaw =
                cover.attributes
                  ?.volume;

              if (!volumenRaw)
                return null;

              const volumenTexto =
  volumenRaw.toString();

// ignorar variantes .1 .2 etc

if (
  volumenTexto.includes(
    '.',
  )
) {
  return null;
}

const numero =
  parseInt(
    volumenTexto,
  );

              return isNaN(
                numero,
              )
                ? null
                : numero;
            })
            .filter(
              (
                n,
              ): n is number =>
                n !== null,
            ),
        ),
      ).sort(
        (
          a: number,
          b: number,
        ) => a - b,
      );
    

    // =========================
    // Actualizar / crear tomos
    // =========================

    const listadoMangaId =
      await this.listadoMangaService.buscarColeccionPorTitulo(
        dto.titulo,
      );

    console.log(
      'LISTADOMANGA ID:',
      listadoMangaId,
    );

    const listadoManga =
      listadoMangaId
        ? await this.listadoMangaService.obtenerColeccion(
            listadoMangaId,
          )
        : null;

    const tomosParseados =
      listadoManga?.tomos || [];
    
    const numerosListado =
      tomosParseados.map(
        (t) => t.numero,
      );
    
    // =========================
    // Actualizar total
    // =========================

    edicion.total_volumenes =
      numerosListado.length;

    if (
      estado ===
      'FINISHED'
    ) {
      edicion.ultimo_tomo_publicado =
        numerosListado.length;
    } else {
      edicion.ultimo_tomo_publicado =
        numerosListado.filter(
          (n) => {
            const tomo =
              tomosParseados.find(
                (t) =>
                  t.numero === n,
              );

            return (
              tomo?.estado ===
              'publicado'
            );
          },
        ).length;
    }

    await this.edicionRepo.save(
      edicion,
    );  

    for (const numero of numerosListado) {

      const tomoListado =
        tomosParseados.find(
          (t) =>
            t.numero === numero,
        );
          const coversTomo =
            covers.filter((c) => {
              const volumenRaw =
                c.attributes
                  ?.volume;

              if (!volumenRaw) {
                return false;
              }

              const texto =
                volumenRaw.toString();

              const numeroBase =
                parseInt(
                  texto.split('.')[0],
                );

              return (
                numeroBase === numero
              );
            });

          // portada principal
          // solo la EXACTA del número

          const portadaPrincipal =
            coversTomo.find((c) => {
              const texto =
                c.attributes.volume.toString();

              return (
                texto ===
                numero.toString()
              );
            }) || coversTomo[0];

          let portada =
            dto.portada_url;

          if (
            portadaPrincipal
              ?.attributes
              ?.fileName
          ) {
            portada = `https://uploads.mangadex.org/covers/${dto.mangadex_id}/${portadaPrincipal.attributes.fileName}`;
          }

          // alternativas
          // variantes .1 .2 etc

          const alternativas =
            coversTomo
              .filter((c) => {
                const texto =
                  c.attributes.volume.toString();

                return (
                  texto !==
                  numero.toString()
                );
              })
              .map((cover) => {
                if (
                  cover?.attributes
                    ?.fileName
                ) {
                  return `https://uploads.mangadex.org/covers/${dto.mangadex_id}/${cover.attributes.fileName}`;
                }

                return null;
              })
              .filter(
                (
                  url,
                ): url is string =>
                  url !== null,
              );

          console.log(
            'TOMO',
            numero,
            'ALT:',
            alternativas.length,
          );

          // buscar existente

          let volumen =
            await this.volumenRepo.findOne(
              {
                where: {
                  edicion_id:
                    edicion.id,

                  numero_tomo:
                    numero,
                },
              },
            );

          // actualizar

          if (volumen) {
  volumen.portada_url =
    portada;

  volumen.portadas_alternativas =
    alternativas;

  volumen.fecha_publicacion =
    tomoListado?.fecha
      ? this.convertirFechaEspanol(
          tomoListado.fecha,
        )
      : undefined;

  volumen.capitulos = [];

  volumen.paginas =
    tomoListado?.paginas ||
    null;

  volumen.precio =
    tomoListado?.precio ||
    null;

  volumen.estado_publicacion =
    tomoListado?.estado ||
    'desconocido';

  volumen.ultima_actualizacion =
    new Date();


  await this.volumenRepo.save(
    volumen,
  );

  console.log(
    'VOLUMEN ACTUALIZADO:',
    volumen.numero_tomo,
    volumen.fecha_publicacion,
    volumen.capitulos,
  );

  continue;
          }

          // crear nuevo

          await this.volumenRepo.save(
            this.volumenRepo.create({
              edicion_id:
                edicion.id,

              numero_tomo:
                numero,

              isbn: `${obra!.id}-${numero}`,

              portada_url:
                portada,

              portadas_alternativas:
                alternativas,
                fecha_publicacion:
                  tomoListado?.fecha
                    ? this.convertirFechaEspanol(
                        tomoListado.fecha,
                      )
                    : undefined,

                capitulos: [],

                paginas:
                  tomoListado?.paginas ||
                  null,

                precio:
                  tomoListado?.precio ||
                  null,

                estado_publicacion:
                  tomoListado?.estado ||
                  'desconocido',

                ultima_actualizacion:
                  new Date(),
            }),
          );
    }



    return obra;
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

        estado:
          edicion.obra
            ?.estado || null,

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