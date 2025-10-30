import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ChatService, ChatMessage } from './chat.service';

interface ChatMessagePayload {
  message: string;
  conversationId?: string;
  userId?: string;
}

interface ConversationState {
  messages: ChatMessage[];
  userId?: string;
  conversationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private conversations: Map<string, ConversationState> = new Map();
  private readonly databaseServiceUrl: string;

  constructor(
    private readonly chatService: ChatService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.databaseServiceUrl = this.configService.get<string>(
      'DATABASE_SERVICE_URL',
      'http://localhost:3002',
    );
  }

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);

    // Extract user info from handshake (if authenticated)
    const userId = client.handshake.auth?.userId;
    
    // Initialize conversation state
    this.conversations.set(clientId, {
      messages: [],
      userId,
    });

    // Send welcome message
    client.emit('connected', {
      message: 'Connected to AI FinOps Assistant',
      clientId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client disconnected: ${clientId}`);

    // Clean up conversation state
    this.conversations.delete(clientId);
  }

  /**
   * Handle chat messages from client
   */
  @SubscribeMessage('chat_message')
  async handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ChatMessagePayload,
  ) {
    const clientId = client.id;
    this.logger.log(`Received message from ${clientId}: ${payload.message.substring(0, 50)}...`);

    try {
      // Get or create conversation state
      let conversation = this.conversations.get(clientId) || {
        messages: [],
        userId: payload.userId,
        conversationId: payload.conversationId, // Use conversationId from payload if provided
      };

      // Update conversationId from payload if provided (user might be continuing an existing conversation)
      if (payload.conversationId) {
        conversation.conversationId = payload.conversationId;
        conversation.userId = payload.userId;
        this.conversations.set(clientId, conversation);
      }

      // Create new conversation ONLY if:
      // 1. User is authenticated (userId exists)
      // 2. No conversationId exists yet (neither in payload nor in memory)
      // 3. This is the first message in a new conversation
      if (payload.userId && !conversation.conversationId) {
        try {
          // Generate a title from the first message (up to 50 characters)
          const tempTitle = payload.message.substring(0, 50) + (payload.message.length > 50 ? '...' : '');
          
          const createConversationResponse = await firstValueFrom(
            this.httpService.post(`${this.databaseServiceUrl}/chat/conversations`, {
              title: tempTitle,
              userId: payload.userId,
            }),
          );

          conversation.conversationId = createConversationResponse.data.id;
          conversation.userId = payload.userId;
          this.conversations.set(clientId, conversation);
          
          this.logger.log(`Created new conversation: ${conversation.conversationId}`);
        } catch (error) {
          this.logger.error(`Failed to create conversation: ${error.message}`);
          // Continue without conversation ID - messages won't be persisted
        }
      }

      // If conversationId provided, load conversation history from database
      if (conversation.conversationId && conversation.messages.length === 0) {
        try {
          const messagesResponse = await firstValueFrom(
            this.httpService.get(
              `${this.databaseServiceUrl}/chat/conversations/${conversation.conversationId}/messages`,
            ),
          );

          if (messagesResponse.data && Array.isArray(messagesResponse.data)) {
            conversation.messages = messagesResponse.data.map((msg: any) => ({
              role: msg.role.toLowerCase() as 'user' | 'assistant' | 'system',
              content: msg.content,
            }));
          }
          
          this.logger.log(`Loaded ${conversation.messages.length} messages from conversation ${conversation.conversationId}`);
        } catch (error) {
          this.logger.warn(`Could not load conversation history: ${error.message}`);
        }
      }

      // Emit typing indicator
      client.emit('ai_typing', { isTyping: true });

      // Save user message to database
      if (payload.userId && conversation.conversationId) {
        try {
          await firstValueFrom(
            this.httpService.post(`${this.databaseServiceUrl}/chat/messages`, {
              conversationId: conversation.conversationId,
              role: 'USER',
              content: payload.message,
            }),
          );
          
          this.logger.log(`Saved user message to conversation ${conversation.conversationId}`);
        } catch (error) {
          this.logger.error(`Failed to save user message: ${error.message}`);
          if (error.response?.data) {
            this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
          }
        }
      }

      // Process message with chat service
      const response = await this.chatService.processMessage(
        payload.message,
        conversation.messages,
      );

      // Update conversation state
      conversation.messages = response.conversationHistory;
      this.conversations.set(clientId, conversation);

      // Save assistant response to database
      if (payload.userId && conversation.conversationId && response.message && response.message.trim()) {
        try {
          const messageData = {
            conversationId: conversation.conversationId,
            role: 'ASSISTANT',
            content: response.message.trim(),
            toolsUsed: response.toolsUsed && response.toolsUsed.length > 0 ? response.toolsUsed : undefined,
          };
          
          await firstValueFrom(
            this.httpService.post(`${this.databaseServiceUrl}/chat/messages`, messageData),
          );
          
          this.logger.log(`Saved assistant message to conversation ${conversation.conversationId}`);
        } catch (error) {
          this.logger.error(`Failed to save assistant message: ${error.message}`);
          if (error.response?.data) {
            this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
          }
        }
      } else if (payload.userId && conversation.conversationId && (!response.message || !response.message.trim())) {
        this.logger.warn(`Skipping save of empty assistant message for conversation ${conversation.conversationId}`);
      }

      // Stop typing indicator
      client.emit('ai_typing', { isTyping: false });

      // Send response to client
      client.emit('chat_response', {
        message: response.message,
        toolsUsed: response.toolsUsed,
        conversationId: conversation.conversationId,
        timestamp: new Date().toISOString(),
      });

      this.logger.log(`Sent response to ${clientId}`);
    } catch (error) {
      this.logger.error(`Error processing message from ${clientId}:`, error);

      // Stop typing indicator
      client.emit('ai_typing', { isTyping: false });

      // Send error response
      client.emit('chat_error', {
        error: 'Failed to process message',
        message: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle request to clear conversation
   */
  @SubscribeMessage('clear_conversation')
  handleClearConversation(@ConnectedSocket() client: Socket) {
    const clientId = client.id;
    this.logger.log(`Clearing conversation for ${clientId}`);

    const conversation = this.conversations.get(clientId);
    if (conversation) {
      conversation.messages = [];
      this.conversations.set(clientId, conversation);
    }

    client.emit('conversation_cleared', {
      message: 'Conversation cleared',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle request to get conversation history
   */
  @SubscribeMessage('get_history')
  handleGetHistory(@ConnectedSocket() client: Socket) {
    const clientId = client.id;
    const conversation = this.conversations.get(clientId);

    client.emit('conversation_history', {
      messages: conversation?.messages || [],
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle ping for connection health check
   */
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', {
      timestamp: new Date().toISOString(),
    });
  }
}
