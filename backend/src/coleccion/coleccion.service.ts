import { Injectable } from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { Volumen } from '../volumenes/volumen.entity';

import {
  ColeccionItem,
  EstadoColeccion,
} from './coleccion-item.entity';

import { AddToCollectionDto } from './dto/add-to-collection.dto';

@Injectable()
export class ColeccionService {
  constructor(
    @InjectRepository(Volumen)
    private volumenRepo: Repository<Volumen>,

    @InjectRepository(ColeccionItem)
    private coleccionRepo: Repository<ColeccionItem>,
  ) {}

  async obtenerHuecos(
    usuarioId: string,
    edicionId: string,
  ) {
    const volumenes =
      await this.volumenRepo.find({
        where: {
          edicion_id: edicionId,
        },

        relations: {
          edicion: {
            obra: true,
          },
        },

        order: {
          numero_tomo: 'ASC',
        },
      });

    const coleccion =
      await this.coleccionRepo.find({
        where: {
          usuario_id: usuarioId,
        },
      });

    // Inferir estado de la serie a partir de los tomos si la obra no tiene estado
    const inferirEstadoDesdeTomos = (vols: Volumen[]): string => {
      const hoy = new Date();
      const sinFechaOFutura = vols.some(
        (v) => !v.fecha_publicacion || new Date(v.fecha_publicacion) > hoy,
      );
      return sinFechaOFutura ? 'ongoing' : 'completed';
    };

    const estadoObra = volumenes[0]?.edicion?.obra?.estado
      ?? (volumenes.length > 0 ? inferirEstadoDesdeTomos(volumenes) : null);

    return volumenes.map((vol) => {
      let estado = 'hueco';

      const item = coleccion.find((c) => c.volumen_id === vol.id);
      if (item) estado = item.estado;

      return {
        id: vol.id,
        numero_tomo: vol.numero_tomo,
        isbn: vol.isbn,
        portada_url: vol.portada_url || vol.edicion?.obra?.portada_url || null,
        portadas_alternativas: vol.portadas_alternativas || [],
        estado,
        publicado:
          vol.fecha_publicacion
            ? new Date(vol.fecha_publicacion) <= new Date()
            : vol.numero_tomo <= (vol.edicion?.ultimo_tomo_publicado || 0),
        nombre_manga: vol.edicion?.obra?.titulo_es,
        estado_manga: estadoObra,
        fecha_publicacion: vol.fecha_publicacion,
        capitulos: vol.capitulos || [],
        estado_stock: vol.estado_stock,
      };
    });
          }

  async añadirATuColeccion(
    usuarioId: string,
    dto: AddToCollectionDto,
  ) {
    const existe =
      await this.coleccionRepo.findOne({
        where: {
          usuario_id: usuarioId,

          volumen_id:
            dto.volumen_id,
        },
      });

    if (existe) {
      existe.estado = dto.estado;

      await this.coleccionRepo.save(
        existe,
      );

      return {
        message:
          'Colección actualizada',
      };
    }

    const item =
      this.coleccionRepo.create({
        usuario_id: usuarioId,

        volumen_id:
          dto.volumen_id,

        estado: dto.estado,
      });

    await this.coleccionRepo.save(item);

    return {
      message:
        'Añadido a colección',
    };
  }

  async obtenerBiblioteca(
    usuarioId: string,
  ) {
    const items =
      await this.coleccionRepo.find({
        where: {
          usuario_id: usuarioId,

          estado:
            EstadoColeccion.POSEIDO,
        },

        relations: {
          volumen: {
            edicion: {
              obra: true,
            },
          },
        },
      });

    const mapa = new Map();

    for (const item of items) {
      const obra =
        item.volumen.edicion.obra;

      if (!mapa.has(obra.id)) {
        mapa.set(obra.id, {
          id: obra.id,
          titulo_es: obra.titulo_es,
          portada_url: obra.portada_url,
          tipo: obra.tipo ?? null,
          tomos_poseidos: 0,
          total_tomos: item.volumen.edicion.total_volumenes || 0,
        });
      }

      mapa.get(obra.id)
        .tomos_poseidos++;
    }

    return Array.from(
      mapa.values(),
    ).map((obra: any) => ({
      ...obra,

      porcentaje:
        obra.total_tomos > 0
          ? Math.round(
              (obra.tomos_poseidos /
                obra.total_tomos) *
                100,
            )
          : 0,
    }));
  }

  async quitarDeColeccion(
    usuarioId: string,
    volumenId: string,
  ) {
    await this.coleccionRepo.delete({
      usuario_id: usuarioId,

      volumen_id: volumenId,
    });

    return {
      message:
        'Eliminado de colección',
    };
  }

  async obtenerWishlist(
    usuarioId: string,
  ) {
    const items =
      await this.coleccionRepo.find({
        where: {
          usuario_id: usuarioId,

          estado:
            EstadoColeccion.WISHLIST,
        },

        relations: {
          volumen: {
            edicion: {
              obra: true,
            },
          },
        },
      });

    const mapa = new Map();

    for (const item of items) {
      const obra =
        item.volumen.edicion.obra;

      if (!mapa.has(obra.id)) {
        mapa.set(obra.id, {
          id: obra.id,

          titulo_es:
            obra.titulo_es,

          portada_url:
            obra.portada_url,

          tomos_wishlist: 0,
        });
      }

      mapa.get(obra.id)
        .tomos_wishlist++;
    }

    return Array.from(
      mapa.values(),
    );
  }
}