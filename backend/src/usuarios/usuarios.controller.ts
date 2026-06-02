import {
  Body,
  Controller,
  Get,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth } from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { UsuarioService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuarioService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async obtenerPerfil(
    @Req() req,
  ) {
    return this.usuariosService.obtenerPerfil(
      req.user.sub,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Put('me')
  async actualizarPerfil(
    @Req() req,

    @Body() body,
  ) {
    return this.usuariosService.actualizarPerfil(
      req.user.sub,
      body,
    );
  }
}