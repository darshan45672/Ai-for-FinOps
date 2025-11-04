import { Module } from '@nestjs/common';
import { CostTrackingService } from './cost-tracking.service';
import { CostTrackingController } from './cost-tracking.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CostTrackingController],
  providers: [CostTrackingService],
  exports: [CostTrackingService],
})
export class CostTrackingModule {}
