import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  CreateConversationDto,
  UpdateConversationDto,
  CreateMessageDto,
  ConversationResponseDto,
  ConversationWithMessagesDto,
  MessageResponseDto,
} from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Create a new conversation
   * POST /chat/conversations
   */
  @Post('conversations')
  async createConversation(
    @Body() dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    return this.chatService.createConversation(dto);
  }

  /**
   * Get all conversations for a user
   * GET /chat/conversations?userId=xxx&includeInactive=true
   */
  @Get('conversations')
  async getUserConversations(
    @Query('userId') userId: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ConversationResponseDto[]> {
    return this.chatService.getUserConversations(
      userId,
      includeInactive === 'true',
    );
  }

  /**
   * Get a specific conversation with messages
   * GET /chat/conversations/:id?userId=xxx
   */
  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ): Promise<ConversationWithMessagesDto> {
    return this.chatService.getConversationById(id, userId);
  }

  /**
   * Update a conversation
   * PUT /chat/conversations/:id?userId=xxx
   */
  @Put('conversations/:id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @Query('userId') userId?: string,
  ): Promise<ConversationResponseDto> {
    return this.chatService.updateConversation(id, dto, userId);
  }

  /**
   * Delete a conversation
   * DELETE /chat/conversations/:id?userId=xxx
   */
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConversation(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ): Promise<void> {
    return this.chatService.deleteConversation(id, userId);
  }

  /**
   * Create a message in a conversation
   * POST /chat/messages
   */
  @Post('messages')
  async createMessage(
    @Body() dto: CreateMessageDto,
  ): Promise<MessageResponseDto> {
    // Auto-update conversation title if it's the first user message
    if (dto.role === 'USER') {
      const messages = await this.chatService.getConversationMessages(
        dto.conversationId,
        1,
      );
      if (messages.length === 0) {
        await this.chatService.updateConversationTitleIfNew(
          dto.conversationId,
          dto.content,
        );
      }
    }

    return this.chatService.createMessage(dto);
  }

  /**
   * Get messages for a conversation
   * GET /chat/conversations/:id/messages?limit=50
   */
  @Get('conversations/:id/messages')
  async getConversationMessages(
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
  ): Promise<MessageResponseDto[]> {
    return this.chatService.getConversationMessages(
      conversationId,
      limit ? parseInt(limit.toString(), 10) : undefined,
    );
  }
}
