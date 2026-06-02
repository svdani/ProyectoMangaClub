import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Volumen } from './volumen.entity';

@Injectable()
export class VolumenesService {
  constructor(
    @InjectRepository(Volumen)
    private volumenRepo: Repository<Volumen>,
  ) {}

  async obtenerPorId(
    id: string,
  ) {
    const volumen =
      await this.volumenRepo.findOne(
        {
          where: {
            id,
          },

          relations: {
            edicion: {
              obra: true,
            },
          },
        },
      );

    if (!volumen) {
      return null;
    }

    return {
      id: volumen.id,

      numero_tomo:
        volumen.numero_tomo,

      isbn: volumen.isbn,

      portada_url:
        volumen.portada_url,

      portadas_alternativas:
        volumen.portadas_alternativas,

      estado_stock:
        volumen.estado_stock,

      fecha_publicacion:
        volumen.fecha_publicacion,

      capitulos:
        volumen.capitulos ||
        [],
        
      precio: volumen.precio,

      paginas: volumen.paginas,

      estado_publicacion:
        volumen.estado_publicacion,

      ultima_actualizacion:
        volumen.ultima_actualizacion,

      nombre_manga:
        volumen.edicion?.obra
          ?.titulo_es,

      estado_manga:
        volumen.edicion?.obra
          ?.estado,
    };
  }
}