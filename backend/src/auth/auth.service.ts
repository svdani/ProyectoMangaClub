import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { Usuario } from '../usuarios/usuario.entity';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private usuarioRepo: Repository<Usuario>,

    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existe = await this.usuarioRepo.findOne({
      where: [
        { email: dto.email },
        { username: dto.username },
      ],
    });

    if (existe) {
      throw new BadRequestException(
        'Usuario o email ya existen',
      );
    }

    const usuario = this.usuarioRepo.create({
      username: dto.username,
      email: dto.email,
      password_hash: dto.password,
    });

    await this.usuarioRepo.save(usuario);

    return {
      message: 'Usuario registrado',
    };
  }

  async login(dto: LoginDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: {
        email: dto.email,
      },
      select: {
        id: true,
        email: true,
        username: true,
        password_hash: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const passwordCorrecta = await bcrypt.compare(
      dto.password,
      usuario.password_hash,
    );

    if (!passwordCorrecta) {
      throw new UnauthorizedException(
        'Credenciales inválidas',
      );
    }

    const payload = {
      sub: usuario.id,
      email: usuario.email,
    };

    return {
      access_token: await this.jwtService.signAsync(
        payload,
      ),
      usuario: {
        id: usuario.id,
        username: usuario.username,
        email: usuario.email,
      },
    };
  }
}