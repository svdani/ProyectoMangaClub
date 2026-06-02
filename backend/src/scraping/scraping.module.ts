// src/scraping/scraping.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';

import { ScrapingService } from './scraping.service';
import { ListadoMangaService } from './listado-manga.service';
import { ListadoMangaSyncService } from './listado-manga-sync.service';
import { ListadoMangaCronService } from './listado-manga-cron.service';
import { ScrapingController } from './scraping.controller';

import { Obra } from '../obras/obra.entity';
import { Edicion } from '../ediciones/edicion.entity';
import { Volumen } from '../volumenes/volumen.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Obra, Edicion, Volumen]),
  ],
  controllers: [ScrapingController],
  providers: [
    ScrapingService,
    ListadoMangaService,
    ListadoMangaSyncService,
    ListadoMangaCronService,
  ],
  exports: [
    ScrapingService,
    ListadoMangaService,
    ListadoMangaSyncService,
    ListadoMangaCronService,
  ],
})
export class ScrapingModule {}
