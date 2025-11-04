import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AiCostTrackerService } from './ai-cost-tracker.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AiCostTrackerService],
  exports: [AiCostTrackerService],
})
export class AiCostTrackerModule {}
