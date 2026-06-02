import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Volumen } from './volumen.entity';

import { VolumenesService } from './volumenes.service';

import { VolumenesController } from './volumenes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Volumen,
    ]),
  ],

  providers: [
    VolumenesService,
  ],

  controllers: [
    VolumenesController,
  ],

  exports: [
    VolumenesService,
  ],
})
export class VolumenesModule {}