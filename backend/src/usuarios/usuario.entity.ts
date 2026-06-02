import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

import * as bcrypt from 'bcryptjs';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    length: 50,
    unique: true,
    nullable: true,
  })
  username: string;

  @Column({
    length: 255,
    unique: true,
  })
  email: string;

  @Column({
    length: 255,
    select: false,
  })
  password_hash: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  avatar_url: string;

  @Column({
    length: 200,
    nullable: true,
  })
  bio: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  expo_push_token: string;

  @Column({
    default: true,
  })
  notificaciones_activas: boolean;

  @Column({
    default: false,
  })
  es_moderador: boolean;

  @CreateDateColumn()
  creado_en: Date;

  @UpdateDateColumn()
  actualizado_en: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    // evitar rehashear

    if (
      this.password_hash &&
      !this.password_hash.startsWith(
        '$2',
      )
    ) {
      this.password_hash =
        await bcrypt.hash(
          this.password_hash,
          10,
        );
    }
  }

  async verificarPassword(
    password: string,
  ): Promise<boolean> {
    return bcrypt.compare(
      password,
      this.password_hash,
    );
  }
}