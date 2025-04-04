import ApiService from './ApiService';

export interface Message {
  id: string;
  case_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface MessageListResponse {
  messages: Message[];
  total: number;
}

export interface CreateMessageRequest {
  role: 'user' | 'assistant';
  content: string;
}

class MessageService extends ApiService {
  async getMessages(caseId: string, skip = 0, limit = 100): Promise<MessageListResponse> {
    return this.get<MessageListResponse>(
      `/cases/${caseId}/messages`,
      { params: { skip, limit } }
    );
  }

  async createMessage(caseId: string, message: CreateMessageRequest): Promise<Message> {
    return this.post<Message>(`/cases/${caseId}/messages`, message);
  }

  // Helper to convert API message to UI format
  formatMessageForUI(apiMessage: Message): {
    content: string;
    sender: 'doctor' | 'assistant';
    timestamp: string;
  } {
    const timestamp = new Date(apiMessage.created_at).toLocaleTimeString();
    const sender = apiMessage.role === 'user' ? 'doctor' as const : 'assistant' as const;

    return {
      content: apiMessage.content,
      sender,
      timestamp
    };
  }
}

export default new MessageService();