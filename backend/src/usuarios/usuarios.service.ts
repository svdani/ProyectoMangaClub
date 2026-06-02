import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Usuario } from './usuario.entity';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,
  ) {}

  async obtenerPerfil(
    usuarioId: string,
  ) {
    const usuario =
      await this.usuarioRepo.findOne({
        where: {
          id: usuarioId,
        },

        select: {
          id: true,

          email: true,

          username: true,

          avatar_url: true,

          bio: true,
        },
      });

    return usuario;
  }

  async actualizarPerfil(
    usuarioId: string,

    body: any,
  ) {
    const usuario =
      await this.usuarioRepo.findOne({
        where: {
          id: usuarioId,
        },

        select: {
          id: true,

          email: true,

          username: true,

          password_hash: true,
        },
      });

    if (!usuario) {
      return {
        message:
          'Usuario no encontrado',
      };
    }

    // username único

    if (
      body.username &&
      body.username !==
        usuario.username
    ) {
      const existe =
        await this.usuarioRepo.findOne({
          where: {
            username:
              body.username,
          },
        });

      if (existe) {
        return {
          message:
            'Username ya en uso',
        };
      }

      usuario.username =
        body.username;
    }

    // password

    if (body.password) {
      usuario.password_hash =
        body.password;
    }

    await this.usuarioRepo.save(
      usuario,
    );

    return {
      message:
        'Perfil actualizado',

      username:
        usuario.username,

      email:
        usuario.email,
    };
  }
}