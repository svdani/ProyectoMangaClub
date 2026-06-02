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
import { Volumen } from '../volumenes/volumen.entity';

@Entity('wishlist_item')
@Unique(['usuario_id', 'volumen_id'])
export class WishlistItem {
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

  @CreateDateColumn()
  fecha_añadido: Date;
}