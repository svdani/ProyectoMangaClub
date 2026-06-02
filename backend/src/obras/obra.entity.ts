import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { Edicion } from '../ediciones/edicion.entity';

export enum TipoObra {
  MANGA = 'manga',
  COMIC_US = 'comic_us',
  NOVELA_GRAFICA = 'novela_grafica',
  BD_EUROPEA = 'bd_europea',
  COMIC_NACIONAL = 'comic_nacional',
}

export enum EstadoObra {
  EN_CURSO = 'en_curso',

  COMPLETADA = 'completada',

  CANCELADA = 'cancelada',

  PAUSADA = 'pausada',
}

@Entity('obra')
export class Obra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', default: '' })
  titulo_es: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  titulo_original: string;

  @Column({
    type: 'enum',
    enum: TipoObra,
    default: TipoObra.MANGA,
  })
  tipo: TipoObra;

  @Column({
  nullable: true,
  })
  estado: string;


  @Column({
    nullable: true,
  })
  anilist_id: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  descripcion: string;

  @Column({
    nullable: true,
  })
  banner_url: string;

  @Column({
    nullable: true,
  })
  score: number;

  @Column({
    type: 'text',
    nullable: true,
  })
  sinopsis: string;

  @Column({
    type: 'text',
    array: true,
    default: '{}',
  })
  autores: string[];

  @Column({
    type: 'text',
    array: true,
    default: '{}',
  })
  generos: string[];

  @Column({
    length: 100,
    nullable: true,
  })
  demografia: string;

  @Column({
    length: 10,
    nullable: true,
  })
  pais_origen: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  portada_url: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  bannerImage: string;

  @Column({
    length: 100,
    nullable: true,
  })
  fuente_externa: string;

  @Column({
    length: 100,
    nullable: true,
  })
  id_externo: string;

  @Column({
    type: 'float',
    default: 0,
  })
  puntuacion_media: number;

  @Column({
    default: 0,
  })
  total_valoraciones: number;

  @Column({
    nullable: true,
    unique: true,
  })
  mangadex_id: string;

  @Column({
    nullable: true,
  })
  listado_manga_id: string;

  @OneToMany(
    () => Edicion,
    (edicion) => edicion.obra,
  )
  ediciones: Edicion[];

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}