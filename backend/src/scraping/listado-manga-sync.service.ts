// src/scraping/listado-manga-sync.service.ts

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Obra, TipoObra } from '../obras/obra.entity';
import { Edicion } from '../ediciones/edicion.entity';
import { Volumen, EstadoStock } from '../volumenes/volumen.entity';
import { ListadoMangaService, CatalogoRef } from './listado-manga.service';

const CONCURRENT = 5;

@Injectable()
export class ListadoMangaSyncService {
  private readonly logger = new Logger(ListadoMangaSyncService.name);

  constructor(
    private readonly scraper: ListadoMangaService,
    @InjectRepository(Obra)    private obraRepo:    Repository<Obra>,
    @InjectRepository(Edicion) private edicionRepo: Repository<Edicion>,
    @InjectRepository(Volumen) private volumenRepo: Repository<Volumen>,
  ) {}

  // ─── Entry point del cron ─────────────────────────────────────────────────
  async syncAll(): Promise<void> {
    this.logger.log('▶ Iniciando sync catálogo ListadoManga...');

    const remotos = await this.scraper.obtenerCatalogo();

    // select como objeto (TypeORM 0.3+)
    const locales = await this.obraRepo.find({
      select: { listado_manga_id: true },
      where: { listado_manga_id: Not(IsNull()) },
    });
    const localIds = new Set(locales.map((o) => o.listado_manga_id!));

    const nuevos = remotos.filter((r) => !localIds.has(r.listadoMangaId));
    this.logger.log(`Remoto: ${remotos.length} | Local: ${localIds.size} | Nuevos: ${nuevos.length}`);

    if (nuevos.length > 0) {
      await this.seedReferencias(nuevos);
      await this.syncDetallesConPool(nuevos, CONCURRENT);
    }

    await this.syncEdicionesEnCurso();
    this.logger.log('✅ Sync completado');
  }

  // ─── Seed ligero de nuevas obras ─────────────────────────────────────────
  private async seedReferencias(refs: CatalogoRef[]): Promise<void> {
    this.logger.log(`Insertando ${refs.length} referencias nuevas...`);
    const BATCH = 50;
    for (let i = 0; i < refs.length; i += BATCH) {
      const chunk = refs.slice(i, i + BATCH);
      await this.obraRepo
        .createQueryBuilder()
        .insert()
        .into(Obra)
        .values(
          chunk.map((r) => ({
            titulo_es:         r.titulo,
            listado_manga_id:  r.listadoMangaId,
            fuente_externa:    'listadomanga',
            id_externo:        r.listadoMangaId,
            tipo:              TipoObra.MANGA,
          })),
        )
        .orIgnore()
        .execute();
    }
  }

  // ─── Pool de concurrencia ─────────────────────────────────────────────────
  private async syncDetallesConPool(refs: CatalogoRef[], concurrency: number): Promise<void> {
    this.logger.log(`Scrapeando ${refs.length} colecciones (pool x${concurrency})...`);
    let i = 0;
    const worker = async (): Promise<void> => {
      while (i < refs.length) {
        const ref = refs[i++];
        try {
          await this.syncUnaColeccion(ref.listadoMangaId);
        } catch (err) {
          this.logger.error(`Error detalle ${ref.listadoMangaId}: ${(err as Error).message}`);
        }
        await this.scraper.sleep(300);
      }
    };
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
  }

  // ─── Sincroniza una colección concreta ───────────────────────────────────
  async syncUnaColeccion(listadoMangaId: string): Promise<void> {
    const detalle = await this.scraper.obtenerColeccion(listadoMangaId);
    if (!detalle) return;

    // Obra
    let obra = await this.obraRepo.findOne({ where: { listado_manga_id: listadoMangaId } });
    if (!obra) {
      obra = this.obraRepo.create({
        titulo_es:        detalle.titulo,
        listado_manga_id: listadoMangaId,
        fuente_externa:   'listadomanga',
        id_externo:       listadoMangaId,
        tipo:             TipoObra.MANGA,
      });
    }
    obra.titulo_es = detalle.titulo;
    if (detalle.tituloOriginal) obra.titulo_original = detalle.tituloOriginal;
    if (detalle.autores.length)  obra.autores = detalle.autores;
    if (detalle.portadaUrl)      obra.portada_url = detalle.portadaUrl;
    await this.obraRepo.save(obra);

    // Edición española
    let edicion = await this.edicionRepo.findOne({ where: { obra_id: obra.id, pais: 'ES' } });
    if (!edicion) {
      edicion = this.edicionRepo.create({
        obra_id:        obra.id,
        pais:           'ES',
        idioma:         'es',
        editorial:      detalle.editorial ?? 'Desconocida',
        nombre_edicion: detalle.titulo,
        activa:         true,
      });
    }
    const publicados = detalle.tomos.filter((t) => t.estado === 'publicado');
    edicion.total_volumenes       = detalle.tomos.length;
    edicion.ultimo_tomo_publicado = publicados.length > 0 ? Math.max(...publicados.map((t) => t.numero)) : 0;
    await this.edicionRepo.save(edicion);

    // Volúmenes — upsert real: actualiza datos si ya existe (edicion_id + numero_tomo)
    for (const t of detalle.tomos) {
      await this.volumenRepo
        .createQueryBuilder()
        .insert()
        .into(Volumen)
        .values({
          edicion_id:         edicion!.id,
          numero_tomo:        t.numero,
          paginas:            t.paginas  ?? undefined,
          precio:             t.precio   ?? undefined,
          fecha_publicacion:  t.fechaPublicacion,
          estado_publicacion: t.estado,
          estado_stock:       t.estado === 'publicado' ? EstadoStock.DISPONIBLE : EstadoStock.PROXIMAMENTE,
          portada_url:        t.portadaTomoUrl ?? undefined,
        })
        .orUpdate(
          ['paginas', 'precio', 'fecha_publicacion', 'estado_publicacion', 'estado_stock', 'portada_url'],
          ['edicion_id', 'numero_tomo'],
        )
        .execute();
    }
  }

  // ─── Re-sync completo de todas las obras existentes ─────────────────────
  async resyncTodas(): Promise<void> {
    this.logger.log('▶ Iniciando re-sync completo de todas las obras con listado_manga_id...');

    const obras = await this.obraRepo.find({
      select: { listado_manga_id: true },
      where: { listado_manga_id: Not(IsNull()) },
    });

    this.logger.log(`Total obras a re-sincronizar: ${obras.length}`);

    const ids = obras.map((o) => o.listado_manga_id!);
    let i = 0;
    const worker = async (): Promise<void> => {
      while (i < ids.length) {
        const id = ids[i++];
        try {
          await this.syncUnaColeccion(id);
        } catch (err) {
          this.logger.error(`Error re-sync ${id}: ${(err as Error).message}`);
        }
        await this.scraper.sleep(300);
      }
    };
    await Promise.all(Array.from({ length: CONCURRENT }, () => worker()));
    this.logger.log('✅ Re-sync completo terminado');
  }

  // ─── Re-sync nocturno ─────────────────────────────────────────────────────
  private async syncEdicionesEnCurso(): Promise<void> {
    const obras = await this.obraRepo
      .createQueryBuilder('o')
      .innerJoin('o.ediciones', 'e', 'e.activa = true AND e.pais = :pais', { pais: 'ES' })
      .where('o.listado_manga_id IS NOT NULL')
      .orderBy('o.actualizado_en', 'ASC')
      .take(50)
      .getMany();

    if (!obras.length) return;
    this.logger.log(`Re-sync de ${obras.length} ediciones en curso`);

    for (const obra of obras) {
      try {
        await this.syncUnaColeccion(obra.listado_manga_id!);
        await this.scraper.sleep();
      } catch (err) {
        this.logger.error(`Re-sync error ${obra.listado_manga_id}: ${(err as Error).message}`);
      }
    }
  }
}
