/**
 * Example usage of WhatsApp MCP Server
 * 
 * This file demonstrates how to use the WhatsApp MCP server
 * to send messages and check delivery status.
 */

// Type declarations for Node.js globals
declare const console: any;
declare const setTimeout: any;

import { createWhatsAppMCPServer } from './whatsapp';

/**
 * Example 1: Send a simple WhatsApp message
 */
async function sendSimpleMessage() {
  // Create WhatsApp MCP server instance
  const whatsapp = createWhatsAppMCPServer({
    secretName: 'fibonacci/mcp/whatsapp',
    timeout: 30000,
    maxRetries: 3,
  });

  try {
    // Send message
    const response = await whatsapp.sendMessage({
      to: '+5511987654321',
      message: 'Olá! Somos da Alquimista.AI e gostaríamos de conversar sobre como podemos ajudar sua empresa.',
    });

    console.log('Message sent successfully!');
    console.log('Message ID:', response.messageId);
    console.log('Status:', response.status);
    console.log('Timestamp:', response.timestamp);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

/**
 * Example 2: Send message with idempotency key
 */
async function sendMessageWithIdempotency() {
  const whatsapp = createWhatsAppMCPServer();

  const leadId = 'lead-123';
  const campaignId = 'campaign-456';

  try {
    // Use idempotency key to prevent duplicate sends
    const idempotencyKey = `${leadId}-${campaignId}-${Date.now()}`;

    const response = await whatsapp.sendMessage({
      to: '+5511987654321',
      message: 'Esta é uma mensagem importante sobre sua proposta.',
      idempotencyKey,
    });

    console.log('Message sent with idempotency:', response.messageId);

    // If we try to send again with the same key, it will return cached response
    const cachedResponse = await whatsapp.sendMessage({
      to: '+5511987654321',
      message: 'Esta é uma mensagem importante sobre sua proposta.',
      idempotencyKey,
    });

    console.log('Same message ID returned from cache:', cachedResponse.messageId);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

/**
 * Example 3: Check message delivery status
 */
async function checkMessageStatus() {
  const whatsapp = createWhatsAppMCPServer();

  try {
    // First, send a message
    const sendResponse = await whatsapp.sendMessage({
      to: '+5511987654321',
      message: 'Teste de status de entrega',
    });

    console.log('Message sent:', sendResponse.messageId);

    // Wait a bit for delivery
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Check status
    const statusResponse = await whatsapp.getMessageStatus(sendResponse.messageId);

    console.log('Message status:', statusResponse.status);
    console.log('Last updated:', statusResponse.timestamp);

    if (statusResponse.errorCode) {
      console.log('Error code:', statusResponse.errorCode);
      console.log('Error message:', statusResponse.errorMessage);
    }
  } catch (error) {
    console.error('Failed to check status:', error);
  }
}

/**
 * Example 4: Send multiple messages with rate limiting
 */
async function sendBulkMessages() {
  const whatsapp = createWhatsAppMCPServer({
    rateLimit: {
      messagesPerSecond: 10, // Lower rate for this example
      messagesPerMinute: 100,
      messagesPerHour: 1000,
    },
  });

  const leads = [
    { id: 'lead-1', phone: '+5511987654321', name: 'João' },
    { id: 'lead-2', phone: '+5511987654322', name: 'Maria' },
    { id: 'lead-3', phone: '+5511987654323', name: 'Pedro' },
    // ... more leads
  ];

  console.log(`Sending messages to ${leads.length} leads...`);

  for (const lead of leads) {
    try {
      const response = await whatsapp.sendMessage({
        to: lead.phone,
        message: `Olá ${lead.name}! Temos uma proposta especial para você.`,
        idempotencyKey: `bulk-${lead.id}-${Date.now()}`,
      });

      console.log(`✓ Message sent to ${lead.name}: ${response.messageId}`);
    } catch (error) {
      console.error(`✗ Failed to send to ${lead.name}:`, error);
    }
  }

  console.log('Bulk send complete!');
}

/**
 * Example 5: Integration with Lambda handler
 */
export async function lambdaHandler(event: any) {
  const whatsapp = createWhatsAppMCPServer();

  const { leadId, phoneNumber, message, campaignId } = event;

  try {
    // Send message
    const response = await whatsapp.sendMessage({
      to: phoneNumber,
      message,
      idempotencyKey: `${leadId}-${campaignId}`,
    });

    // Log success
    console.log('Message sent successfully', {
      leadId,
      messageId: response.messageId,
      status: response.status,
    });

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        messageId: response.messageId,
        status: response.status,
      }),
    };
  } catch (error) {
    // Log error
    console.error('Failed to send message', {
      leadId,
      error: (error as Error).message,
    });

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: (error as Error).message,
      }),
    };
  }
}

/**
 * Example 6: Error handling
 */
async function handleErrors() {
  const whatsapp = createWhatsAppMCPServer();

  try {
    // This will fail - invalid phone number format
    await whatsapp.sendMessage({
      to: '11987654321', // Missing + prefix
      message: 'Test message',
    });
  } catch (error: any) {
    if (error.code === 'WHATSAPP_INVALID_PHONE') {
      console.error('Invalid phone number format. Use international format: +5511987654321');
    }
  }

  try {
    // This will fail - message too long
    const longMessage = 'A'.repeat(5000);
    await whatsapp.sendMessage({
      to: '+5511987654321',
      message: longMessage,
    });
  } catch (error: any) {
    if (error.code === 'WHATSAPP_MESSAGE_TOO_LONG') {
      console.error('Message exceeds 4096 character limit');
    }
  }

  try {
    // This will fail - missing required parameter
    await whatsapp.sendMessage({
      to: '+5511987654321',
      message: '', // Empty message
    });
  } catch (error: any) {
    if (error.code === 'WHATSAPP_INVALID_PARAMS') {
      console.error('Missing required parameter');
    }
  }
}

// Run examples (uncomment to test)
// sendSimpleMessage();
// sendMessageWithIdempotency();
// checkMessageStatus();
// sendBulkMessages();
// handleErrors();
