import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth } from '@nestjs/swagger';

import { ColeccionService } from './coleccion.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AddToCollectionDto } from './dto/add-to-collection.dto';

@Controller('coleccion')
export class ColeccionController {
  constructor(
    private readonly coleccionService: ColeccionService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('huecos/:edicionId')
  async obtenerHuecos(
    @Param('edicionId') edicionId: string,
    @Req() req,
  ) {
    return this.coleccionService.obtenerHuecos(
      req.user.sub,
      edicionId,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  async añadirATuColeccion(
    @Req() req,
    @Body() dto: AddToCollectionDto,
  ) {
    return this.coleccionService.añadirATuColeccion(
      req.user.sub,
      dto,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('biblioteca')
  async obtenerBiblioteca(
    @Req() req,
  ) {
    return this.coleccionService.obtenerBiblioteca(
      req.user.sub,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('wishlist')
  async obtenerWishlist(
    @Req() req,
  ) {
    return this.coleccionService.obtenerWishlist(
      req.user.sub,
    );
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete(':volumenId')
  async quitarDeColeccion(
    @Param('volumenId')
    volumenId: string,

    @Req() req,
  ) {
    return this.coleccionService.quitarDeColeccion(
      req.user.sub,
      volumenId,
    );
  }
}