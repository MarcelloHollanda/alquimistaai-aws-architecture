// Tipos comuns para o Micro Agente de Disparo & Agendamento
// AlquimistaAI - Padrão Oficial

export interface Contact {
  pk: string; // CONTACT#<uuid>
  id: string; // Alias para pk
  company?: string;
  contactName: string;
  name?: string; // Alias para contactName
  phone?: string;
  email: string;
  linkedinUrl?: string;
  position?: string;
  industry?: string;
  location?: string;
  status: 'active' | 'inactive' | 'blocked' | 'qualified' | 'responded' | 'unresponsive' | 'meeting_scheduled';
  segment: 'B2B' | 'B2C';
  createdAt: string;
  updatedAt: string;
  lastInteractionAt?: string;
  messageHistory?: string[];
  responseRate?: number;
  engagementScore?: number;
  metadata?: Record<string, any>;
}

export interface Campaign {
  pk: string; // CAMPAIGN#<uuid>
  name: string;
  type: 'initial' | 'follow_up' | 'nurturing';
  status: 'draft' | 'active' | 'paused' | 'completed';
  targetSegment: string;
  channels: ('whatsapp' | 'email')[];
  schedule: {
    startDate: string;
    endDate?: string;
    businessHoursOnly: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  pk: string; // MESSAGE#<uuid>
  id?: string; // Opcional para compatibilidade
  contactId: string;
  campaignId: string;
  channel: MessageChannel;
  type?: MessageType; // Tipo da mensagem
  content: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  repliedAt?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export interface Interaction {
  pk: string; // INTERACTION#<uuid>
  contactId: string;
  messageId?: string;
  type: 'message_sent' | 'message_received' | 'meeting_scheduled' | 'meeting_completed';
  channel: 'whatsapp' | 'email' | 'calendar';
  content: string;
  context: Record<string, any>;
  createdAt: string;
}

export interface Schedule {
  pk: string; // SCHEDULE#<uuid>
  contactId: string;
  interactionId?: string;
  title: string;
  description: string;
  scheduledFor: string;
  duration: number; // em minutos
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  meetingLink?: string;
  createdAt: string;
  updatedAt: string;
}

// Configurações de ambiente
export interface EnvironmentConfig {
  CONTACTS_TABLE: string;
  CAMPAIGNS_TABLE: string;
  MESSAGES_TABLE: string;
  INTERACTIONS_TABLE: string;
  SCHEDULES_TABLE: string;
  MESSAGE_QUEUE_URL: string;
  DLQ_URL: string;
  WHATSAPP_SECRET_ARN: string;
  EMAIL_SECRET_ARN: string;
  CALENDAR_SECRET_ARN: string;
  ENVIRONMENT: 'dev' | 'prod';
  AWS_REGION: string;
}

// Eventos SQS
export interface MessageQueueEvent {
  type: 'send_message' | 'process_reply' | 'schedule_meeting';
  contactId: string;
  campaignId?: string;
  messageId?: string;
  data: Record<string, any>;
  timestamp: string;
}

// Resposta padrão das Lambdas
export interface LambdaResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// Tipos adicionais para send-messages.ts
export type MessageChannel = 'whatsapp' | 'email' | 'linkedin';
export type MessageType = 'initial' | 'follow_up' | 'nurturing' | 'meeting_request' | 'reply';
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'replied' | 'failed';

export interface MessageSendEvent {
  campaignId?: string;
  contactIds?: string[];
  messageType: MessageType;
  channel: MessageChannel;
  customMessage?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingResult {
  success: boolean;
  processed: number;
  failed: number;
  errors: Array<{
    id?: string;
    error: string;
  }>;
}

// Nomes das tabelas DynamoDB
export const TABLE_NAMES = {
  CONTACTS: process.env.CONTACTS_TABLE || 'contacts',
  CAMPAIGNS: process.env.CAMPAIGNS_TABLE || 'campaigns',
  MESSAGES: process.env.MESSAGES_TABLE || 'messages',
  INTERACTIONS: process.env.INTERACTIONS_TABLE || 'interactions',
  SCHEDULES: process.env.SCHEDULES_TABLE || 'schedules',
  MEETINGS: process.env.MEETINGS_TABLE || 'meetings'
};

// Tipos adicionais para handle-replies.ts
export interface ReplyHandleEvent {
  messageId: string;
  contactId: string;
  channel: MessageChannel;
  replyContent: string;
  receivedAt: string;
  metadata?: Record<string, any>;
}

// Tipos adicionais para schedule-meeting.ts
export interface MeetingScheduleEvent {
  contactId: string;
  scheduledAt: string;
  duration: number;
  type: string;
  title?: string;
  description?: string;
  location?: string;
  generateBriefing?: boolean;
  metadata?: Record<string, any>;
}

export interface MeetingRequest {
  id: string;
  contactId: string;
  scheduledAt: string;
  duration: number;
  type: string;
  status: MeetingStatus;
  title?: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export type MeetingStatus = 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
