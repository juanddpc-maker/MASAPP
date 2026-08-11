import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AlumnosModule } from './alumnos/alumnos.module';
import { TutoresModule } from './tutores/tutores.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { CintasModule } from './cintas/cintas.module';
import { EventosModule } from './eventos-cambio-cinta/eventos.module';
import { PagosModule } from './pagos/pagos.module';
import { ComunicacionModule } from './comunicacion/comunicacion.module';
import { InventarioModule } from './inventario/inventario.module';
import { VentasModule } from './ventas/ventas.module';
import { ComportamientoModule } from './comportamiento/comportamiento.module';
import { EscuelaModule } from './escuela/escuela.module';
import { DisciplinasModule } from './disciplinas/disciplinas.module';
import { HorariosModule } from './horarios/horarios.module';
import { EmailModule } from './email/email.module';
import { HistorialModule } from './historial-cintas/historial.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    EmailModule,
    AuthModule,
    AlumnosModule,
    TutoresModule,
    UsuariosModule,
    CintasModule,
    EventosModule,
    PagosModule,
    ComunicacionModule,
    InventarioModule,
    VentasModule,
    ComportamientoModule,
    EscuelaModule,
    DisciplinasModule,
    HorariosModule,
    HistorialModule,
  ],
})
export class AppModule {}
