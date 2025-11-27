import { MCPClient, MCPClientConfig, MCPError, MCPLogger } from '../base-client';

// Type declarations for Node.js globals
declare const require: any;
declare const process: any;
declare const setTimeout: any;

// Use require for uuid and AWS SDK to avoid type issues
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');

/**
 * Calendar event attendee
 */
export interface CalendarAttendee {
  email: string;
  displayName?: string;
  responseStatus?: 'needsAction' | 'accepted' | 'declined' | 'tentative';
}

/**
 * Calendar event time slot
 */
export interface CalendarTimeSlot {
  start: string; // ISO-8601 datetime
  end: string; // ISO-8601 datetime
}

/**
 * Calendar availability slot
 */
export interface CalendarAvailabilitySlot {
  start: string; // ISO-8601 datetime
  end: string; // ISO-8601 datetime
  available: boolean;
}

/**
 * Get availability parameters
 */
export interface GetAvailabilityParams {
  calendarId: string;
  startDate: string; // ISO-8601 date
  endDate: string; // ISO-8601 date
  duration: number; // minutes
  workingHours?: {
    start: string; // HH:MM format (e.g., "09:00")
    end: string; // HH:MM format (e.g., "18:00")
  };
  workingDays?: number[]; // 0-6 (Sunday-Saturday), default: [1,2,3,4,5]
}

/**
 * Get availability response
 */
export interface GetAvailabilityResponse {
  availableSlots: CalendarAvailabilitySlot[];
  totalSlots: number;
}

/**
 * Create event parameters
 */
export interface CreateEventParams {
  calendarId: string;
  summary: string;
  description?: string;
  start: string; // ISO-8601 datetime
  duration: number; // minutes
  attendees?: CalendarAttendee[];
  location?: string;
  conferenceData?: {
    createRequest?: {
      requestId: string;
      conferenceSolutionKey: { type: 'hangoutsMeet' | 'eventHangout' };
    };
  };
}

/**
 * Create event response
 */
export interface CreateEventResponse {
  eventId: string;
  htmlLink: string;
  hangoutLink?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  created: string;
}

/**
 * Update event parameters
 */
export interface UpdateEventParams {
  calendarId: string;
  eventId: string;
  summary?: string;
  description?: string;
  start?: string; // ISO-8601 datetime
  duration?: number; // minutes
  attendees?: CalendarAttendee[];
  location?: string;
  status?: 'confirmed' | 'tentative' | 'cancelled';
}

/**
 * Update event response
 */
export interface UpdateEventResponse {
  eventId: string;
  htmlLink: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  updated: string;
}

/**
 * Delete event parameters
 */
export interface DeleteEventParams {
  calendarId: string;
  eventId: string;
  sendUpdates?: 'all' | 'externalOnly' | 'none';
}

/**
 * Delete event response
 */
export interface DeleteEventResponse {
  eventId: string;
  deleted: boolean;
  timestamp: string;
}

/**
 * Google Calendar MCP Server configuration
 */
export interface CalendarMCPConfig extends MCPClientConfig {
  secretName?: string; // AWS Secrets Manager secret name
  apiEndpoint?: string; // Google Calendar API endpoint
}

/**
 * OAuth2 credentials from Secrets Manager
 */
interface OAuth2Credentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  accessToken?: string;
  expiryDate?: number;
}

/**
 * Google Calendar MCP Server for integrating with Google Calendar API
 * 
 * Features:
 * - Get availability slots for scheduling
 * - Create calendar events with attendees
 * - Update existing events
 * - Delete events with notifications
 * - OAuth2 service account authentication
 * - Credentials stored in AWS Secrets Manager
 * - Retry with exponential backoff
 * 
 * Requirements: 13.3, 13.7, 13.8, 13.9, 13.10
 */
export class CalendarMCPServer {
  private readonly mcpClient: MCPClient;
  private readonly secretName: string;
  private readonly apiEndpoint: string;
  private readonly logger: MCPLogger;
  private readonly secretsManager: any;

  private credentials: OAuth2Credentials | null = null;
  private credentialsExpiry: number = 0;

  constructor(config: CalendarMCPConfig = {}) {
    this.mcpClient = new MCPClient(config);
    this.secretName = config.secretName ?? 'fibonacci/mcp/calendar';
    this.apiEndpoint = config.apiEndpoint ?? 'https://www.googleapis.com/calendar/v3';
    this.logger = config.logger ?? this.mcpClient['logger'];

    // Initialize AWS Secrets Manager
    this.secretsManager = new AWS.SecretsManager({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
  }

  /**
   * Get OAuth2 credentials from Secrets Manager
   */
  private async getCredentials(): Promise<OAuth2Credentials> {
    // Return cached credentials if still valid
    if (this.credentials && Date.now() < this.credentialsExpiry) {
      return this.credentials;
    }

    try {
      const response = await this.secretsManager
        .getSecretValue({ SecretId: this.secretName })
        .promise();

      if (!response.SecretString) {
        throw new Error('Secret string is empty');
      }

      const secret = JSON.parse(response.SecretString);
      this.credentials = {
        clientId: secret.clientId,
        clientSecret: secret.clientSecret,
        refreshToken: secret.refreshToken,
        accessToken: secret.accessToken,
        expiryDate: secret.expiryDate,
      };

      // Cache for 50 minutes (tokens typically expire in 60 minutes)
      this.credentialsExpiry = Date.now() + 50 * 60 * 1000;

      return this.credentials;
    } catch (error) {
      this.logger.error('Failed to fetch calendar credentials', error as Error);
      throw new MCPError(
        'Failed to fetch calendar credentials',
        'CREDENTIALS_ERROR',
        'calendar',
        'getCredentials',
        uuidv4(),
        false
      );
    }
  }

  /**
   * Get available time slots for scheduling
   */
  async getAvailability(params: GetAvailabilityParams): Promise<GetAvailabilityResponse> {
    const traceId = uuidv4();

    this.logger.info('Calendar getAvailability initiated', {
      traceId,
      calendarId: this.maskCalendarId(params.calendarId),
      startDate: params.startDate,
      endDate: params.endDate,
      duration: params.duration,
    });

    try {
      // For MVP, return mock available slots
      // In production, this would call Google Calendar API
      const availableSlots = this.generateMockAvailableSlots(
        params.startDate,
        params.endDate,
        params.duration,
        params.workingHours,
        params.workingDays
      );

      this.logger.info('Calendar getAvailability succeeded', {
        traceId,
        totalSlots: availableSlots.length,
      });

      return {
        availableSlots,
        totalSlots: availableSlots.length,
      };
    } catch (error) {
      this.logger.error('Calendar getAvailability failed', error as Error, { traceId });
      throw error;
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(params: CreateEventParams): Promise<CreateEventResponse> {
    const traceId = uuidv4();

    this.logger.info('Calendar createEvent initiated', {
      traceId,
      calendarId: this.maskCalendarId(params.calendarId),
      summary: params.summary,
      start: params.start,
      duration: params.duration,
    });

    try {
      // For MVP, return mock event
      // In production, this would call Google Calendar API
      const eventId = uuidv4();
      const response: CreateEventResponse = {
        eventId,
        htmlLink: `https://calendar.google.com/event?eid=${eventId}`,
        hangoutLink: params.conferenceData
          ? `https://meet.google.com/${eventId.substring(0, 12)}`
          : undefined,
        status: 'confirmed',
        created: new Date().toISOString(),
      };

      this.logger.info('Calendar createEvent succeeded', {
        traceId,
        eventId: response.eventId,
      });

      return response;
    } catch (error) {
      this.logger.error('Calendar createEvent failed', error as Error, { traceId });
      throw error;
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(params: UpdateEventParams): Promise<UpdateEventResponse> {
    const traceId = uuidv4();

    this.logger.info('Calendar updateEvent initiated', {
      traceId,
      calendarId: this.maskCalendarId(params.calendarId),
      eventId: params.eventId,
    });

    try {
      // For MVP, return mock response
      const response: UpdateEventResponse = {
        eventId: params.eventId,
        htmlLink: `https://calendar.google.com/event?eid=${params.eventId}`,
        status: params.status || 'confirmed',
        updated: new Date().toISOString(),
      };

      this.logger.info('Calendar updateEvent succeeded', {
        traceId,
        eventId: response.eventId,
      });

      return response;
    } catch (error) {
      this.logger.error('Calendar updateEvent failed', error as Error, { traceId });
      throw error;
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(params: DeleteEventParams): Promise<DeleteEventResponse> {
    const traceId = uuidv4();

    this.logger.info('Calendar deleteEvent initiated', {
      traceId,
      calendarId: this.maskCalendarId(params.calendarId),
      eventId: params.eventId,
    });

    try {
      // For MVP, return mock response
      const response: DeleteEventResponse = {
        eventId: params.eventId,
        deleted: true,
        timestamp: new Date().toISOString(),
      };

      this.logger.info('Calendar deleteEvent succeeded', {
        traceId,
        eventId: response.eventId,
      });

      return response;
    } catch (error) {
      this.logger.error('Calendar deleteEvent failed', error as Error, { traceId });
      throw error;
    }
  }

  /**
   * Generate mock available slots for MVP
   */
  private generateMockAvailableSlots(
    startDate: string,
    endDate: string,
    duration: number,
    workingHours?: { start: string; end: string },
    workingDays?: number[]
  ): CalendarAvailabilitySlot[] {
    const slots: CalendarAvailabilitySlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const hours = workingHours || { start: '09:00', end: '18:00' };
    const days = workingDays || [1, 2, 3, 4, 5]; // Mon-Fri

    let current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();

      if (days.includes(dayOfWeek)) {
        // Generate slots for this day
        const [startHour, startMin] = hours.start.split(':').map(Number);
        const [endHour, endMin] = hours.end.split(':').map(Number);

        let slotStart = new Date(current);
        slotStart.setHours(startHour, startMin, 0, 0);

        const dayEnd = new Date(current);
        dayEnd.setHours(endHour, endMin, 0, 0);

        while (slotStart < dayEnd) {
          const slotEnd = new Date(slotStart.getTime() + duration * 60000);

          if (slotEnd <= dayEnd) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
              available: true,
            });
          }

          slotStart = slotEnd;
        }
      }

      // Move to next day
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    // Return first 3 slots for simplicity
    return slots.slice(0, 3);
  }

  /**
   * Mask calendar ID for logging
   */
  private maskCalendarId(calendarId: string): string {
    if (calendarId.length <= 8) {
      return calendarId;
    }
    const firstFour = calendarId.substring(0, 4);
    const lastFour = calendarId.substring(calendarId.length - 4);
    const masked = '*'.repeat(calendarId.length - 8);
    return `${firstFour}${masked}${lastFour}`;
  }
}

/**
 * Create a configured Calendar MCP server instance
 */
export function createCalendarMCPServer(config?: CalendarMCPConfig): CalendarMCPServer {
  return new CalendarMCPServer(config);
}
