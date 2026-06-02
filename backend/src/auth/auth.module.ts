import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { Usuario } from '../usuarios/usuario.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),

    JwtModule.register({
      secret: 'SUPER_SECRET_JWT',
      signOptions: {
        expiresIn: '30d',
      },
    }),
  ],

  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
  ],
})
export class AuthModule {}