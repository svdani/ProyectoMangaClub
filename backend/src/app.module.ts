import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ObrasModule } from './obras/obras.module';
import { EdicionesModule } from './ediciones/ediciones.module';
import { VolumenesModule } from './volumenes/volumenes.module';
import { ColeccionModule } from './coleccion/coleccion.module';
import { AuthModule } from './auth/auth.module';
import { ScrapingModule } from './scraping/scraping.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'admin',
      database: 'mangaclub',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UsuariosModule,
    ObrasModule,
    EdicionesModule,
    VolumenesModule,
    ColeccionModule,
    AuthModule,
    ScrapingModule,
  ],
})
export class AppModule {}