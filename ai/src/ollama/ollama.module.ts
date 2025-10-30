import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { OllamaController } from './ollama.controller';
import { OllamaService } from './ollama.service';

/**
 * Ollama Module
 * 
 * This module encapsulates all Ollama-related functionality including:
 * - Ollama service for API communication
 * - REST API controller for Ollama endpoints
 * - DTOs for request/response validation
 * 
 * The OllamaService is exported to be used by other modules like ChatModule
 */
@Module({
  imports: [
    HttpModule.register({
      timeout: 120000, // 2 minutes timeout for LLM requests
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  controllers: [OllamaController],
  providers: [OllamaService],
  exports: [OllamaService], // Export for use in other modules
})
export class OllamaModule {}
