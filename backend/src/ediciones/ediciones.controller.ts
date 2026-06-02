import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { EdicionesService } from './ediciones.service';

@Controller('ediciones')
export class EdicionesController {
  constructor(
    private readonly edicionesService: EdicionesService,
  ) {}

  @Get(':id/volumenes')
  obtenerVolumenes(
    @Param('id') id: string,
  ) {
    return this.edicionesService.obtenerVolumenes(
      id,
    );
  }
}