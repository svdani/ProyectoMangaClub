import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { VolumenesService } from './volumenes.service';

@Controller('volumenes')
export class VolumenesController {
  constructor(
    private readonly volumenesService: VolumenesService,
  ) {}

  @Get(':id')
  async obtenerPorId(
    @Param('id')
    id: string,
  ) {
    return this.volumenesService.obtenerPorId(
      id,
    );
  }
}