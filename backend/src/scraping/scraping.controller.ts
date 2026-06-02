// src/scraping/scraping.controller.ts

import { Controller, Post, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ListadoMangaCronService } from './listado-manga-cron.service';
import { ListadoMangaSyncService } from './listado-manga-sync.service';
import { Obra } from '../obras/obra.entity';

@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly cron: ListadoMangaCronService,
    private readonly sync: ListadoMangaSyncService,
    @InjectRepository(Obra) private obraRepo: Repository<Obra>,
  ) {}

  /** POST /scraping/sync — dispara sync completo en background */
  @Post('sync')
  triggerSync() {
    return this.cron.triggerManual();
  }

  /** POST /scraping/sync/:id — sincroniza una colección por ID de ListadoManga */
  @Post('sync/:id')
  async syncOne(@Param('id') id: string) {
    await this.sync.syncUnaColeccion(id);
    return { message: `Colección ${id} sincronizada` };
  }

  /**
   * POST /scraping/resync-todas — re-scrapea todas las obras existentes con el scraper arreglado.
   * Tarda bastante (3431 obras × ~300ms = ~17 min). Corre en background.
   */
  @Post('resync-todas')
  resyncTodas() {
    this.sync.resyncTodas().catch((err) =>
      console.error('Error en resync-todas:', err),
    );
    return { mensaje: 'Re-sync completo iniciado en background. Revisa los logs del backend.' };
  }

  /**
   * POST /scraping/limpiar-titulos-originales
   * Pone a NULL los titulo_original con más de 150 caracteres (datos corruptos del scraper antiguo).
   */
  @Post('limpiar-titulos-originales')
  async limpiarTitulosOriginales() {
    const result = await this.obraRepo
      .createQueryBuilder()
      .update(Obra)
      .set({ titulo_original: () => 'NULL' })
      .where('LENGTH(titulo_original) > 150')
      .execute();

    return { actualizadas: result.affected ?? 0 };
  }
}