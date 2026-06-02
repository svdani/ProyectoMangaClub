import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

import { Edicion } from '../ediciones/edicion.entity';

export enum EstadoStock {
  DISPONIBLE = 'disponible',
  AGOTADO = 'agotado',
  PROXIMAMENTE = 'proximamente',
  DESCATALOGADO = 'descatalogado',
}

@Entity('volumen')
@Index(['edicion_id', 'numero_tomo'], {
  unique: true,
})
export class Volumen {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => Edicion,
    (edicion) => edicion.volumenes,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({
    name: 'edicion_id',
  })
  edicion: Edicion;

  @Column({
    name: 'edicion_id',
  })
  edicion_id: string;

  @Column()
  numero_tomo: number;

  @Column({
    length: 100,
    nullable: true,
    unique: true,
  })
  isbn: string;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  fecha_publicacion?: Date;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
  })
  capitulos: string[];

  @Column({
    type: 'decimal',
    precision: 6,
    scale: 2,
    nullable: true,
  })
  precio: number | null;

  @Column({
    type: 'int',
    nullable: true,
  })
  paginas: number | null;

  @Column({
    nullable: true,
  })
  estado_publicacion: string;

  @Column({
    nullable: true,
  })
  ultima_actualizacion: Date;

  @Column({
    type: 'text',
    nullable: true,
  })
  portada_url: string;

  @Column({
    type: 'enum',
    enum: EstadoStock,
    default: EstadoStock.DISPONIBLE,
  })
  estado_stock: EstadoStock;

  @Column({
    nullable: true,
  })
  num_paginas: number;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
  })
  portadas_alternativas: string[];

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}