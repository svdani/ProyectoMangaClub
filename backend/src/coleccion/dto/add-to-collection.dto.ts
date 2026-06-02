import {
  IsEnum,
  IsUUID,
} from 'class-validator';

import { EstadoColeccion } from '../coleccion-item.entity';

export class AddToCollectionDto {
  @IsUUID()
  volumen_id: string;

  @IsEnum(EstadoColeccion)
  estado: EstadoColeccion;
}