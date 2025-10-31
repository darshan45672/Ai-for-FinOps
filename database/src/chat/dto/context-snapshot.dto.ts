import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for creating a context snapshot
 */
export class CreateContextSnapshotDto {
  @IsNotEmpty()
  @IsString()
  messageId: string;

  @IsOptional()
  @IsObject()
  userPreferences?: Record<string, any>;

  @IsOptional()
  @IsObject()
  azureState?: Record<string, any>;

  @IsOptional()
  @IsObject()
  conversationMetadata?: Record<string, any>;

  @IsOptional()
  @IsObject()
  historicalData?: Record<string, any>;

  @IsOptional()
  @IsObject()
  relevantDocs?: Record<string, any>;

  @IsOptional()
  @IsObject()
  availableTools?: Record<string, any>;

  @IsOptional()
  @IsObject()
  fullContext?: Record<string, any>;
}

/**
 * DTO for context snapshot response
 */
export class ContextSnapshotResponseDto {
  id: string;
  messageId: string;
  userPreferences?: Record<string, any>;
  azureState?: Record<string, any>;
  conversationMetadata?: Record<string, any>;
  historicalData?: Record<string, any>;
  relevantDocs?: Record<string, any>;
  availableTools?: Record<string, any>;
  fullContext?: Record<string, any>;
  createdAt: Date;
}
