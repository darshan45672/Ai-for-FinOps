import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { McpModule } from './mcp/mcp.module';
import { ChatModule } from './chat/chat.module';

/**
 * Application Root Module
 * 
 * This module imports all feature modules following NestJS modular architecture:
 * - ConfigModule: Global configuration management
 * - CacheModule: Redis-based caching for performance optimization
 * - McpModule: Model Context Protocol tools
 * - ChatModule: WebSocket chat with Gemini AI and context engineering
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: '.env',
    }),
    CacheModule.registerAsync({
      isGlobal: true, // Makes Cache available everywhere
      useFactory: async () => {
        const store = await redisStore({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD || undefined,
          ttl: 600, // Default TTL: 10 minutes (600 seconds)
        });
        return { store };
      },
    }),
    McpModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
