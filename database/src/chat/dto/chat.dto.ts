import { MessageRole } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsArray } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class UpdateConversationDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @IsEnum(MessageRole)
  @IsNotEmpty()
  role: MessageRole;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolsUsed?: string[];
}

export class ConversationResponseDto {
  id: string;
  title: string;
  userId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  messageCount?: number;
  lastMessage?: {
    content: string;
    createdAt: Date;
  };
}

export class MessageResponseDto {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  toolsUsed: string[];
  createdAt: Date;
}

export class ConversationWithMessagesDto extends ConversationResponseDto {
  messages: MessageResponseDto[];
}
