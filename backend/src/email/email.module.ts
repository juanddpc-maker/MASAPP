import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';

// @Global: cualquier módulo puede usar EmailService sin tener que importarlo cada vez
@Global()
@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
