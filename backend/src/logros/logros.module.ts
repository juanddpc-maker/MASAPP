import { Module } from '@nestjs/common';
import { LogrosService } from './logros.service';
import { LogrosController } from './logros.controller';

@Module({
  controllers: [LogrosController],
  providers: [LogrosService],
})
export class LogrosModule {}
