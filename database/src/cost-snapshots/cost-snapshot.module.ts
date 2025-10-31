import { Module } from '@nestjs/common';
import { CostSnapshotController } from './cost-snapshot.controller';
import { CostSnapshotService } from './cost-snapshot.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CostSnapshotController],
  providers: [CostSnapshotService],
  exports: [CostSnapshotService],
})
export class CostSnapshotModule {}
