import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { Edicion } from './edicion.entity';

import { Volumen } from '../volumenes/volumen.entity';

import { EdicionesController } from './ediciones.controller';

import { EdicionesService } from './ediciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Edicion,
      Volumen,
    ]),
  ],

  controllers: [EdicionesController],

  providers: [EdicionesService],
})
export class EdicionesModule {}