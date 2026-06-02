import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Volumen } from '../volumenes/volumen.entity';

@Injectable()
export class EdicionesService {
  constructor(
    @InjectRepository(Volumen)
    private volumenRepo: Repository<Volumen>,
  ) {}

  async obtenerVolumenes(
    edicionId: string,
  ) {
    return this.volumenRepo.find({
      where: {
        edicion_id: edicionId,
      },

      order: {
        numero_tomo: 'ASC',
      },
    });
  }
}