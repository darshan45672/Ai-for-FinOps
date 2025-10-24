import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError, AxiosResponse } from 'axios';
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
 * Service for interacting with Ollama API
 * Handles chat, generation, embeddings, and model management
 */
@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollamaBaseUrl: string;
  private readonly defaultModel: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ollamaBaseUrl = this.configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    this.defaultModel = this.configService.get<string>(
      'OLLAMA_DEFAULT_MODEL',
      'gpt-oss',
    );
    this.logger.log(`Ollama service initialized with base URL: ${this.ollamaBaseUrl}`);
  }

  /**
   * Send a chat request to Ollama
   */
  async chat(request: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      this.logger.debug(`Sending chat request to Ollama with model: ${request.model}`);
      
      const response = await firstValueFrom(
        this.httpService
          .post<ChatResponseDto>(`${this.ollamaBaseUrl}/api/chat`, request)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Ollama chat error: ${error.message}`,
                error.response?.data,
              );
              throw new Error(`Ollama API error: ${error.message}`);
            }),
          ),
      );

      return (response as AxiosResponse<ChatResponseDto>).data;
    } catch (error) {
      this.logger.error(`Failed to send chat request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate text from a prompt
   */
  async generate(request: GenerateRequestDto): Promise<GenerateResponseDto> {
    try {
      this.logger.debug(`Generating text with model: ${request.model}`);
      
      const response = await firstValueFrom(
        this.httpService
          .post<GenerateResponseDto>(`${this.ollamaBaseUrl}/api/generate`, request)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Ollama generate error: ${error.message}`,
                error.response?.data,
              );
              throw new Error(`Ollama API error: ${error.message}`);
            }),
          ),
      );

      return (response as AxiosResponse<GenerateResponseDto>).data;
    } catch (error) {
      this.logger.error(`Failed to generate text: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate embeddings for text
   */
  async embed(request: EmbeddingsRequestDto): Promise<EmbeddingsResponseDto> {
    try {
      this.logger.debug(`Generating embeddings with model: ${request.model}`);
      
      const response = await firstValueFrom(
        this.httpService
          .post<EmbeddingsResponseDto>(`${this.ollamaBaseUrl}/api/embeddings`, request)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Ollama embeddings error: ${error.message}`,
                error.response?.data,
              );
              throw new Error(`Ollama API error: ${error.message}`);
            }),
          ),
      );

      return (response as AxiosResponse<EmbeddingsResponseDto>).data;
    } catch (error) {
      this.logger.error(`Failed to generate embeddings: ${error.message}`);
      throw error;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<ListModelsResponseDto> {
    try {
      this.logger.debug('Fetching list of available models');
      
      const response = await firstValueFrom(
        this.httpService
          .get<ListModelsResponseDto>(`${this.ollamaBaseUrl}/api/tags`)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Ollama list models error: ${error.message}`,
                error.response?.data,
              );
              throw new Error(`Ollama API error: ${error.message}`);
            }),
          ),
      );

      return (response as AxiosResponse<ListModelsResponseDto>).data;
    } catch (error) {
      this.logger.error(`Failed to list models: ${error.message}`);
      throw error;
    }
  }

  /**
   * Pull a model from Ollama library
   */
  async pullModel(request: PullModelRequestDto): Promise<any> {
    try {
      this.logger.log(`Pulling model: ${request.name}`);
      
      const response = await firstValueFrom(
        this.httpService
          .post(`${this.ollamaBaseUrl}/api/pull`, request)
          .pipe(
            catchError((error: AxiosError) => {
              this.logger.error(
                `Ollama pull model error: ${error.message}`,
                error.response?.data,
              );
              throw new Error(`Ollama API error: ${error.message}`);
            }),
          ),
      );

      return (response as AxiosResponse).data;
    } catch (error) {
      this.logger.error(`Failed to pull model: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if Ollama service is healthy
   */
  async healthCheck(): Promise<{ status: string; baseUrl: string; defaultModel: string }> {
    try {
      await firstValueFrom(
        this.httpService.get(`${this.ollamaBaseUrl}/`).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Ollama health check failed: ${error.message}`);
            throw new Error('Ollama service is not available');
          }),
        ),
      );

      return {
        status: 'healthy',
        baseUrl: this.ollamaBaseUrl,
        defaultModel: this.defaultModel,
      };
    } catch (error) {
      this.logger.error(`Ollama health check failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get default model name
   */
  getDefaultModel(): string {
    return this.defaultModel;
  }
}
