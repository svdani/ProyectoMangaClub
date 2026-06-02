import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Obra } from '../obras/obra.entity';
import { Volumen } from '../volumenes/volumen.entity';

@Entity('edicion')
export class Edicion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Obra, (obra) => obra.ediciones, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'obra_id' })
  obra: Obra;

  @Column({ name: 'obra_id' })
  obra_id: string;

  @Column({ length: 10 })
  pais: string;

  @Column({ length: 200 })
  editorial: string;

  @Column({ length: 10 })
  idioma: string;

  @Column({ length: 100, nullable: true })
  formato: string;

  @Column({ length: 300, nullable: true })
  nombre_edicion: string;

  @Column({ type: 'text', nullable: true })
  portada_url: string;

  @Column({ nullable: true })
  total_volumenes: number;

  @Column({ default: true })
  activa: boolean;
 
  @Column({
    default: 0,
  })
  ultimo_tomo_publicado: number;

  @OneToMany(() => Volumen, (volumen) => volumen.edicion)
  volumenes: Volumen[];

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;
}