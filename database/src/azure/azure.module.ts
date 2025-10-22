import { Module } from '@nestjs/common';
import { AzureController } from './azure.controller';
import { AzureService } from './azure.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AzureController],
  providers: [AzureService],
  exports: [AzureService],
})
export class AzureModule {}
