import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AzureMcpGatewayService } from './azure-mcp-gateway.service';
import { AzureMcpGatewayController } from './azure-mcp-gateway.controller';

@Module({
  imports: [HttpModule],
  controllers: [AzureMcpGatewayController],
  providers: [AzureMcpGatewayService],
  exports: [AzureMcpGatewayService],
})
export class AzureMcpGatewayModule {}
