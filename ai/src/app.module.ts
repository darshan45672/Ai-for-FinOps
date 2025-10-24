import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OllamaModule } from './ollama/ollama.module';
import { McpModule } from './mcp/mcp.module';
import { ChatModule } from './chat/chat.module';

/**
 * Application Root Module
 * 
 * This module imports all feature modules following NestJS modular architecture:
 * - OllamaModule: Ollama LLM integration
 * - McpModule: Model Context Protocol tools
 * - ChatModule: WebSocket chat with AI capabilities
 * 
 * HttpModule is configured within each feature module that needs it.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      envFilePath: '.env',
    }),
    OllamaModule,
    McpModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
