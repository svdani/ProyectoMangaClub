import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';

import { Usuario } from '../usuarios/usuario.entity';
import { Volumen } from '../volumenes/volumen.entity';

export enum EstadoColeccion {
  POSEIDO = 'poseido',

  LEIDO = 'leido',

  PENDIENTE = 'pendiente',

  WISHLIST = 'wishlist',
}

@Entity('coleccion_item')
@Unique(['usuario_id', 'volumen_id'])
export class ColeccionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuario_id: string;

  @ManyToOne(() => Volumen, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'volumen_id' })
  volumen: Volumen;

  @Column({ name: 'volumen_id' })
  volumen_id: string;

  @Column({
    type: 'enum',
    enum: EstadoColeccion,
    default: EstadoColeccion.POSEIDO,
  })
  estado: EstadoColeccion;

  @CreateDateColumn()
  fecha_añadido: Date;
}