import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { AzureService } from './azure.service';
import { AzureSchedulerService } from './azure-scheduler.service';
import { AzureController } from './azure.controller';

@Module({
  imports: [
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AzureController],
  providers: [AzureService, AzureSchedulerService],
  exports: [AzureService],
})
export class AzureModule {}
