import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { LogsController } from './logs.controller';
import { RequestLoggerInterceptor } from './request-logger.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  controllers: [LogsController],
  providers: [
    LogsService,
    { provide: APP_INTERCEPTOR, useClass: RequestLoggerInterceptor },
  ],
})
export class LogsModule {}
