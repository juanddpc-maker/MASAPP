import { Module } from '@nestjs/common';
import { TutoresService } from './tutores.service';
import { TutoresController } from './tutores.controller';

@Module({
  controllers: [TutoresController],
  providers: [TutoresService],
})
export class TutoresModule {}
