import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsObject, IsNumber, IsBoolean } from 'class-validator';

/**
 * DTO for chat message
 */
export class ChatMessageDto {
  @ApiProperty({ description: 'Role of the message sender', enum: ['system', 'user', 'assistant'] })
  @IsString()
  role: 'system' | 'user' | 'assistant';

  @ApiProperty({ description: 'Content of the message' })
  @IsString()
  content: string;

  @ApiProperty({ description: 'Optional tool calls', required: false })
  @IsOptional()
  @IsArray()
  tool_calls?: any[];
}

/**
 * DTO for chat request
 */
export class ChatRequestDto {
  @ApiProperty({ description: 'Model name to use' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'Array of chat messages', type: [ChatMessageDto] })
  @IsArray()
  messages: ChatMessageDto[];

  @ApiProperty({ description: 'Whether to stream the response', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiProperty({ description: 'Available tools for the model', required: false })
  @IsOptional()
  @IsArray()
  tools?: any[];

  @ApiProperty({ description: 'Additional options for the model', required: false })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;
}

/**
 * DTO for generate request
 */
export class GenerateRequestDto {
  @ApiProperty({ description: 'Model name to use' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'Prompt text' })
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'Whether to stream the response', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiProperty({ description: 'System prompt', required: false })
  @IsOptional()
  @IsString()
  system?: string;
}

/**
 * DTO for embeddings request
 */
export class EmbeddingsRequestDto {
  @ApiProperty({ description: 'Model name to use' })
  @IsString()
  model: string;

  @ApiProperty({ description: 'Text to generate embeddings for' })
  @IsString()
  prompt: string;
}

/**
 * DTO for pull model request
 */
export class PullModelRequestDto {
  @ApiProperty({ description: 'Model name to pull' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Whether to stream the response', required: false, default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}

/**
 * Response DTOs
 */
export class ChatResponseDto {
  @ApiProperty()
  model: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty({ type: ChatMessageDto })
  message: ChatMessageDto;

  @ApiProperty()
  done: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  total_duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  load_duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  prompt_eval_count?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  eval_count?: number;
}

export class GenerateResponseDto {
  @ApiProperty()
  model: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  response: string;

  @ApiProperty()
  done: boolean;
}

export class EmbeddingsResponseDto {
  @ApiProperty()
  embedding: number[];
}

export class ModelInfoDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  modified_at: string;

  @ApiProperty()
  size: number;

  @ApiProperty({ required: false })
  @IsOptional()
  digest?: string;
}

export class ListModelsResponseDto {
  @ApiProperty({ type: [ModelInfoDto] })
  models: ModelInfoDto[];
}
