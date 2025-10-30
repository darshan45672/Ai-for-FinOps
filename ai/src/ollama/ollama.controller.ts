import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OllamaService } from './ollama.service';
import {
  ChatRequestDto,
  ChatResponseDto,
  GenerateRequestDto,
  GenerateResponseDto,
  EmbeddingsRequestDto,
  EmbeddingsResponseDto,
  ListModelsResponseDto,
  PullModelRequestDto,
} from './dto/ollama.dto';

/**
 * Controller for Ollama API endpoints
 * Provides REST API for interacting with local Ollama instance
 */
@ApiTags('Ollama')
@Controller('ai')
export class OllamaController {
  constructor(private readonly ollamaService: OllamaService) {}

  /**
   * Chat endpoint - send messages and receive responses
   */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send a chat message to Ollama' })
  @ApiResponse({
    status: 200,
    description: 'Chat response from Ollama',
    type: ChatResponseDto,
  })
  async chat(@Body() request: ChatRequestDto): Promise<ChatResponseDto> {
    return this.ollamaService.chat(request);
  }

  /**
   * Generate endpoint - generate text from a prompt
   */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate text from a prompt' })
  @ApiResponse({
    status: 200,
    description: 'Generated text response',
    type: GenerateResponseDto,
  })
  async generate(@Body() request: GenerateRequestDto): Promise<GenerateResponseDto> {
    return this.ollamaService.generate(request);
  }

  /**
   * Embeddings endpoint - generate embeddings for text
   */
  @Post('embeddings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate embeddings for text' })
  @ApiResponse({
    status: 200,
    description: 'Embeddings vector',
    type: EmbeddingsResponseDto,
  })
  async embed(@Body() request: EmbeddingsRequestDto): Promise<EmbeddingsResponseDto> {
    return this.ollamaService.embed(request);
  }

  /**
   * List models endpoint - get all available models
   */
  @Get('models')
  @ApiOperation({ summary: 'List all available Ollama models' })
  @ApiResponse({
    status: 200,
    description: 'List of available models',
    type: ListModelsResponseDto,
  })
  async listModels(): Promise<ListModelsResponseDto> {
    return this.ollamaService.listModels();
  }

  /**
   * Pull model endpoint - download a model from Ollama library
   */
  @Post('models/pull')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Pull a model from Ollama library' })
  @ApiResponse({
    status: 202,
    description: 'Model pull initiated',
  })
  async pullModel(@Body() request: PullModelRequestDto): Promise<any> {
    return this.ollamaService.pullModel(request);
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  @ApiOperation({ summary: 'Check Ollama service health' })
  @ApiResponse({
    status: 200,
    description: 'Ollama service status',
  })
  async healthCheck(): Promise<{ status: string; baseUrl: string; defaultModel: string }> {
    return this.ollamaService.healthCheck();
  }
}
