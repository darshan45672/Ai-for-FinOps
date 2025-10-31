import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

/**
 * Service for managing Google Gemini AI client.
 * Provides access to Gemini models for agentic AI capabilities.
 */
@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private client: GoogleGenAI;
  private model: string;

  constructor(private configService: ConfigService) {}

  /**
   * Initialize the Gemini client on module initialization.
   */
  async onModuleInit() {
    try {
      const apiKey = this.configService.get<string>('GEMINI_API_KEY');
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';

      // Initialize Google GenAI client
      this.client = new GoogleGenAI({ apiKey });

      this.logger.log('Gemini service initialized successfully');
      this.logger.log(`Using model: ${this.model}`);
    } catch (error) {
      this.logger.error('Failed to initialize Gemini service:', error);
      throw error;
    }
  }

  /**
   * Get the Gemini client instance.
   */
  getClient(): GoogleGenAI {
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }
    return this.client;
  }

  /**
   * Get the configured model name.
   */
  getModel(): string {
    return this.model;
  }
}
