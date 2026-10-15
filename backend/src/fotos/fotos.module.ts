import { Module } from '@nestjs/common';
import { FotosService } from './fotos.service';
import { FotosController } from './fotos.controller';
import { StorageService } from './storage.service';

@Module({
  controllers: [FotosController],
  providers: [FotosService, StorageService],
})
export class FotosModule {}
