import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { ObrasService } from './obras.service';

import { ImportarObraDto } from './dto/importar-obra.dto';

@Controller('obras')
export class ObrasController {
  constructor(
    private readonly obrasService: ObrasService,
  ) {}

  @Post('importar')
  importarObra(
    @Body() dto: ImportarObraDto,
  ) {
    
    return this.obrasService.importarObra(
      dto,
    );
  }

  @Get()
  obtenerObras() {
    return this.obrasService.obtenerObras();
  }

  // IMPORTANTE:
  // rutas específicas ANTES que /:id

  @Get('buscar')
  buscarPorTitulo(@Query('q') q: string) {
    return this.obrasService.buscarPorTitulo(q || '');
  }

  @Get('mangadex/:id')
  obtenerPorMangadex(
    @Param('id') id: string,
  ) {
    return this.obrasService.obtenerPorMangadex(
      id,
    );
  }

  @Get(':id/ediciones')
  obtenerEdiciones(
    @Param('id') id: string,
  ) {
    return this.obrasService.obtenerEdiciones(
      id,
    );
  }
}