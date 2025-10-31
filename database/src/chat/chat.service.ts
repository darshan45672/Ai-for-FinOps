import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateConversationDto,
  UpdateConversationDto,
  CreateMessageDto,
  ConversationResponseDto,
  MessageResponseDto,
  ConversationWithMessagesDto,
} from './dto/chat.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new conversation
   */
  async createConversation(
    dto: CreateConversationDto,
  ): Promise<ConversationResponseDto> {
    this.logger.log(`Creating conversation for user ${dto.userId}`);

    const conversation = await this.prisma.conversation.create({
      data: {
        title: dto.title,
        userId: dto.userId,
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation._count.messages,
    };
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string,
    includeInactive = false,
  ): Promise<ConversationResponseDto[]> {
    this.logger.log(`Fetching conversations for user ${userId}`);

    const where: Prisma.ConversationWhereInput = { userId };
    if (!includeInactive) {
      where.isActive = true;
    }

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      userId: conv.userId,
      isActive: conv.isActive,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
      lastMessage: conv.messages[0]
        ? {
            content: conv.messages[0].content,
            createdAt: conv.messages[0].createdAt,
          }
        : undefined,
    }));
  }

  /**
   * Get a conversation by ID with all messages
   */
  async getConversationById(
    conversationId: string,
    userId?: string,
  ): Promise<ConversationWithMessagesDto> {
    this.logger.log(`Fetching conversation ${conversationId}`);

    const where: Prisma.ConversationWhereInput = { id: conversationId };
    if (userId) {
      where.userId = userId;
    }

    const conversation = await this.prisma.conversation.findFirst({
      where,
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation ${conversationId} not found`,
      );
    }

    return {
      id: conversation.id,
      title: conversation.title,
      userId: conversation.userId,
      isActive: conversation.isActive,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation._count.messages,
      messages: conversation.messages.map((msg) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        role: msg.role,
        content: msg.content,
        toolsUsed: msg.toolsUsed,
        createdAt: msg.createdAt,
      })),
    };
  }

  /**
   * Update a conversation
   */
  async updateConversation(
    conversationId: string,
    dto: UpdateConversationDto,
    userId?: string,
  ): Promise<ConversationResponseDto> {
    this.logger.log(`Updating conversation ${conversationId}`);

    const where: Prisma.ConversationWhereUniqueInput = { id: conversationId };
    
    // Verify ownership if userId provided
    if (userId) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
      });

      if (!conversation || conversation.userId !== userId) {
        throw new NotFoundException(
          `Conversation ${conversationId} not found`,
        );
      }
    }

    const updated = await this.prisma.conversation.update({
      where,
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    return {
      id: updated.id,
      title: updated.title,
      userId: updated.userId,
      isActive: updated.isActive,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      messageCount: updated._count.messages,
    };
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    userId?: string,
  ): Promise<void> {
    this.logger.log(`Deleting conversation ${conversationId}`);

    // Verify ownership if userId provided
    if (userId) {
      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { userId: true },
      });

      if (!conversation || conversation.userId !== userId) {
        throw new NotFoundException(
          `Conversation ${conversationId} not found`,
        );
      }
    }

    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }

  /**
   * Create a message in a conversation
   */
  async createMessage(dto: CreateMessageDto): Promise<MessageResponseDto> {
    this.logger.log(`Creating message in conversation ${dto.conversationId}`);

    // Verify conversation exists
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: dto.conversationId },
    });

    if (!conversation) {
      throw new NotFoundException(
        `Conversation ${dto.conversationId} not found`,
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId: dto.conversationId,
        role: dto.role,
        content: dto.content,
        toolsUsed: dto.toolsUsed || [],
      },
    });

    // Update conversation's updatedAt timestamp
    await this.prisma.conversation.update({
      where: { id: dto.conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      id: message.id,
      conversationId: message.conversationId,
      role: message.role,
      content: message.content,
      toolsUsed: message.toolsUsed,
      createdAt: message.createdAt,
    };
  }

  /**
   * Get messages for a conversation
   */
  async getConversationMessages(
    conversationId: string,
    limit?: number,
  ): Promise<MessageResponseDto[]> {
    this.logger.log(`Fetching messages for conversation ${conversationId}`);

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      ...(limit && { take: limit }),
    });

    return messages.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      role: msg.role,
      content: msg.content,
      toolsUsed: msg.toolsUsed,
      createdAt: msg.createdAt,
    }));
  }

  /**
   * Generate a title for a conversation based on first message
   */
  async generateConversationTitle(firstMessage: string): Promise<string> {
    // Simple title generation - take first 50 chars
    const title = firstMessage.substring(0, 50);
    return title.length < firstMessage.length ? `${title}...` : title;
  }

  /**
   * Update conversation title automatically if it's still "New Chat"
   */
  async updateConversationTitleIfNew(
    conversationId: string,
    firstMessage: string,
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { title: true },
    });

    if (conversation && conversation.title === 'New Chat') {
      const newTitle = await this.generateConversationTitle(firstMessage);
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { title: newTitle },
      });
    }
  }

  /**
   * Create a context snapshot for a message
   */
  async createContextSnapshot(data: {
    messageId: string;
    userPreferences?: Record<string, any>;
    azureState?: Record<string, any>;
    conversationMetadata?: Record<string, any>;
    historicalData?: Record<string, any>;
    relevantDocs?: Record<string, any>;
    availableTools?: Record<string, any>;
    fullContext?: Record<string, any>;
  }): Promise<any> {
    this.logger.log(`Creating context snapshot for message ${data.messageId}`);

    // Verify message exists
    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message ${data.messageId} not found`);
    }

    const snapshot = await this.prisma.contextSnapshot.create({
      data: {
        messageId: data.messageId,
        userPreferences: data.userPreferences || Prisma.JsonNull,
        azureState: data.azureState || Prisma.JsonNull,
        conversationMetadata: data.conversationMetadata || Prisma.JsonNull,
        historicalData: data.historicalData || Prisma.JsonNull,
        relevantDocs: data.relevantDocs || Prisma.JsonNull,
        availableTools: data.availableTools || Prisma.JsonNull,
        fullContext: data.fullContext || Prisma.JsonNull,
      },
    });

    return {
      id: snapshot.id,
      messageId: snapshot.messageId,
      userPreferences: snapshot.userPreferences,
      azureState: snapshot.azureState,
      conversationMetadata: snapshot.conversationMetadata,
      historicalData: snapshot.historicalData,
      relevantDocs: snapshot.relevantDocs,
      availableTools: snapshot.availableTools,
      fullContext: snapshot.fullContext,
      createdAt: snapshot.createdAt,
    };
  }

  /**
   * Get context snapshot by message ID
   */
  async getContextSnapshotByMessageId(messageId: string): Promise<any | null> {
    this.logger.log(`Fetching context snapshot for message ${messageId}`);

    const snapshot = await this.prisma.contextSnapshot.findUnique({
      where: { messageId },
    });

    if (!snapshot) {
      return null;
    }

    return {
      id: snapshot.id,
      messageId: snapshot.messageId,
      userPreferences: snapshot.userPreferences,
      azureState: snapshot.azureState,
      conversationMetadata: snapshot.conversationMetadata,
      historicalData: snapshot.historicalData,
      relevantDocs: snapshot.relevantDocs,
      availableTools: snapshot.availableTools,
      fullContext: snapshot.fullContext,
      createdAt: snapshot.createdAt,
    };
  }

  /**
   * Get all context snapshots for a conversation
   */
  async getContextSnapshotsByConversationId(
    conversationId: string,
  ): Promise<any[]> {
    this.logger.log(
      `Fetching context snapshots for conversation ${conversationId}`,
    );

    const snapshots = await this.prisma.contextSnapshot.findMany({
      where: {
        message: {
          conversationId,
        },
      },
      include: {
        message: {
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return snapshots.map((snapshot) => ({
      id: snapshot.id,
      messageId: snapshot.messageId,
      message: snapshot.message,
      userPreferences: snapshot.userPreferences,
      azureState: snapshot.azureState,
      conversationMetadata: snapshot.conversationMetadata,
      historicalData: snapshot.historicalData,
      relevantDocs: snapshot.relevantDocs,
      availableTools: snapshot.availableTools,
      fullContext: snapshot.fullContext,
      createdAt: snapshot.createdAt,
    }));
  }
}
