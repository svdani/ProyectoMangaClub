import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';
import { Volumen } from '../volumenes/volumen.entity';

import { ColeccionItem } from './coleccion-item.entity';
import { ColeccionController } from './coleccion.controller';
import { ColeccionService } from './coleccion.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Volumen,
      ColeccionItem,
    ]),

    JwtModule.register({
      secret: 'SUPER_SECRET_JWT',
    }),
  ],

  controllers: [ColeccionController],

  providers: [ColeccionService],
})
export class ColeccionModule {}