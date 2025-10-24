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
import { ChatService, ChatMessage } from './chat.service';

interface ChatMessagePayload {
  message: string;
  conversationId?: string;
}

interface ConversationState {
  messages: ChatMessage[];
  userId?: string;
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

  constructor(private readonly chatService: ChatService) {}

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
      // Get conversation state
      const conversation = this.conversations.get(clientId) || {
        messages: [],
      };

      // Emit typing indicator
      client.emit('ai_typing', { isTyping: true });

      // Process message with chat service
      const response = await this.chatService.processMessage(
        payload.message,
        conversation.messages,
      );

      // Update conversation state
      conversation.messages = response.conversationHistory;
      this.conversations.set(clientId, conversation);

      // Stop typing indicator
      client.emit('ai_typing', { isTyping: false });

      // Send response to client
      client.emit('chat_response', {
        message: response.message,
        toolsUsed: response.toolsUsed,
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
