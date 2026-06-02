import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Column,
  Unique,
} from 'typeorm';

import { Usuario } from '../usuarios/usuario.entity';
import { Edicion } from '../ediciones/edicion.entity';

@Entity('serie_seguida')
@Unique(['usuario_id', 'edicion_id'])
export class SerieSeguida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuario_id: string;

  @ManyToOne(() => Edicion, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'edicion_id' })
  edicion: Edicion;

  @Column({ name: 'edicion_id' })
  edicion_id: string;

  @Column({ default: true })
  alertas: boolean;

  @CreateDateColumn()
  fecha_inicio: Date;
}