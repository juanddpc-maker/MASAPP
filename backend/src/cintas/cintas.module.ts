import { Module } from '@nestjs/common';
import { CintasService } from './cintas.service';
import { CintasController } from './cintas.controller';

@Module({
  controllers: [CintasController],
  providers: [CintasService],
})
export class CintasModule {}
