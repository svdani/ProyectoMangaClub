import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { ObrasController } from './obras.controller';

import { ObrasService } from './obras.service';

import { Obra } from './obra.entity';

import { Edicion } from '../ediciones/edicion.entity';

import { Volumen } from '../volumenes/volumen.entity';

import { ScrapingModule } from '../scraping/scraping.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Obra,
      Edicion,
      Volumen,
    ]),

    ScrapingModule,
  ],

  controllers: [ObrasController],

  providers: [ObrasService],

  exports: [ObrasService],
})
export class ObrasModule {}