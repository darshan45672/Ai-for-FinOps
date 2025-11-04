import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AzureModule } from './azure/azure.module';
import { ChatModule } from './chat/chat.module';
import { CostSnapshotModule } from './cost-snapshots/cost-snapshot.module';
import { RecommendationModule } from './recommendations/recommendation.module';
import { CostTrackingModule } from './cost-tracking/cost-tracking.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AzureModule,
    ChatModule,
    CostSnapshotModule,
    RecommendationModule,
    CostTrackingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
