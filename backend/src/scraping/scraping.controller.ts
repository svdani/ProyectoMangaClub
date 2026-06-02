// src/scraping/scraping.controller.ts

import { Controller, Post, Param } from '@nestjs/common';
import { ListadoMangaCronService } from './listado-manga-cron.service';
import { ListadoMangaSyncService } from './listado-manga-sync.service';

@Controller('scraping')
export class ScrapingController {
  constructor(
    private readonly cron: ListadoMangaCronService,
    private readonly sync: ListadoMangaSyncService,
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
}