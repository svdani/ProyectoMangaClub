// ─────────────────────────────────────────────────────────────────────────────
// src/scraping/listado-manga-cron.service.ts  (NUEVO)
// ─────────────────────────────────────────────────────────────────────────────
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ListadoMangaSyncService } from './listado-manga-sync.service';

@Injectable()
export class ListadoMangaCronService {
  private readonly logger = new Logger(ListadoMangaCronService.name);
  private running = false;

  constructor(private readonly sync: ListadoMangaSyncService) {}

  // Cada día a las 3:00 AM (hora Madrid)
  @Cron('0 3 * * *', { name: 'syncListadoManga', timeZone: 'Europe/Madrid' })
  async handleCron(): Promise<void> {
    if (this.running) {
      this.logger.warn('Sync ya activo, skip');
      return;
    }
    this.running = true;
    try {
      await this.sync.syncAll();
    } catch (err) {
      this.logger.error('Cron fallido:', err);
    } finally {
      this.running = false;
    }
  }

  // Llamar manualmente desde un controller
  async triggerManual(): Promise<{ message: string }> {
    this.handleCron(); // fire & forget
    return { message: 'Sync iniciado en background' };
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// src/scraping/scraping.module.ts  (REEMPLAZA el existente)
// ─────────────────────────────────────────────────────────────────────────────
//
// import { Module } from '@nestjs/common';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { ScheduleModule } from '@nestjs/schedule';
// import { ScrapingService } from './scraping.service';
// import { ListadoMangaService } from './listado-manga.service';
// import { ListadoMangaSyncService } from './listado-manga-sync.service';
// import { ListadoMangaCronService } from './listado-manga-cron.service';
// import { Obra } from '../obras/obra.entity';
// import { Edicion } from '../ediciones/edicion.entity';
// import { Volumen } from '../volumenes/volumen.entity';
//
// @Module({
//   imports: [
//     ScheduleModule.forRoot(),
//     TypeOrmModule.forFeature([Obra, Edicion, Volumen]),
//   ],
//   providers: [
//     ScrapingService,
//     ListadoMangaService,
//     ListadoMangaSyncService,
//     ListadoMangaCronService,
//   ],
//   exports: [
//     ScrapingService,
//     ListadoMangaService,
//     ListadoMangaSyncService,
//     ListadoMangaCronService,
//   ],
// })
// export class ScrapingModule {}
