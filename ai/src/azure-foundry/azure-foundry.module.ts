import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AzureFoundryService } from './azure-foundry.service';

@Module({
  imports: [ConfigModule],
  providers: [AzureFoundryService],
  exports: [AzureFoundryService],
})
export class AzureFoundryModule {}
