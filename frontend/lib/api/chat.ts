import axios from 'axios';

const DATABASE_SERVICE_URL = process.env.NEXT_PUBLIC_DATABASE_SERVICE_URL || 'http://localhost:3002';

export interface Conversation {
  id: string;
  title: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  toolsUsed: string[];
  createdAt: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export interface CreateConversationRequest {
  title: string;
  userId: string;
}

export interface UpdateConversationRequest {
  title?: string;
  isActive?: boolean;
}

export interface CreateMessageRequest {
  conversationId: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
  toolsUsed?: string[];
}

/**
 * Create a new conversation
 */
export async function createConversation(
  data: CreateConversationRequest,
): Promise<Conversation> {
  const response = await axios.post<Conversation>(
    `${DATABASE_SERVICE_URL}/chat/conversations`,
    data,
  );
  return response.data;
}

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string,
  includeInactive = false,
): Promise<Conversation[]> {
  const response = await axios.get<Conversation[]>(
    `${DATABASE_SERVICE_URL}/chat/conversations`,
    {
      params: { userId, includeInactive },
    },
  );
  return response.data;
}

/**
 * Get a specific conversation with messages
 */
export async function getConversation(
  conversationId: string,
  userId?: string,
): Promise<ConversationWithMessages> {
  const response = await axios.get<ConversationWithMessages>(
    `${DATABASE_SERVICE_URL}/chat/conversations/${conversationId}`,
    {
      params: userId ? { userId } : undefined,
    },
  );
  return response.data;
}

/**
 * Update a conversation
 */
export async function updateConversation(
  conversationId: string,
  data: UpdateConversationRequest,
  userId?: string,
): Promise<Conversation> {
  const response = await axios.put<Conversation>(
    `${DATABASE_SERVICE_URL}/chat/conversations/${conversationId}`,
    data,
    {
      params: userId ? { userId } : undefined,
    },
  );
  return response.data;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(
  conversationId: string,
  userId?: string,
): Promise<void> {
  await axios.delete(
    `${DATABASE_SERVICE_URL}/chat/conversations/${conversationId}`,
    {
      params: userId ? { userId } : undefined,
    },
  );
}

/**
 * Create a message in a conversation
 */
export async function createMessage(
  data: CreateMessageRequest,
): Promise<Message> {
  const response = await axios.post<Message>(
    `${DATABASE_SERVICE_URL}/chat/messages`,
    data,
  );
  return response.data;
}

/**
 * Get messages for a conversation
 */
export async function getConversationMessages(
  conversationId: string,
  limit?: number,
): Promise<Message[]> {
  const response = await axios.get<Message[]>(
    `${DATABASE_SERVICE_URL}/chat/conversations/${conversationId}/messages`,
    {
      params: limit ? { limit } : undefined,
    },
  );
  return response.data;
}
