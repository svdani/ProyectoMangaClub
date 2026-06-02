import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';

import { Usuario } from './usuario.entity';

import { UsuarioService } from './usuarios.service';

import { UsuariosController } from './usuarios.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
    ]),

    JwtModule.register({
      secret: 'supersecret',
    }),
  ],

  providers: [UsuarioService],

  controllers: [
    UsuariosController,
  ],

  exports: [UsuarioService],
})
export class UsuariosModule {}