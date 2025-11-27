/**
 * Helper para operações com S3
 * Upload de logs e arquivos de mensagens
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createLogger } from './logger';

const logger = createLogger({ service: 's3-helper' });

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.MESSAGE_LOGS_BUCKET || 'alquimista-message-logs';

export interface MessageLogEntry {
  contactId: string;
  status: string;
  timestamp?: string;
  error?: string;
}

/**
 * Faz upload de log de mensagens para S3
 */
export async function uploadMessageLog(
  entries: MessageLogEntry[],
  batchId: string
): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `message-logs/${batchId}/${timestamp}.json`;

    const logData = {
      batchId,
      timestamp: new Date().toISOString(),
      entries,
      totalEntries: entries.length
    };

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(logData, null, 2),
        ContentType: 'application/json'
      })
    );

    logger.info('Log de mensagens enviado para S3', {
      bucket: BUCKET_NAME,
      key,
      entriesCount: entries.length
    });
  } catch (error) {
    logger.error('Erro ao fazer upload de log para S3', error);
    throw error;
  }
}

/**
 * Faz upload de arquivo de contatos
 */
export async function uploadContactsFile(
  fileContent: string,
  fileName: string
): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `contacts-uploads/${timestamp}-${fileName}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileContent,
        ContentType: 'text/csv'
      })
    );

    logger.info('Arquivo de contatos enviado para S3', {
      bucket: BUCKET_NAME,
      key
    });

    return key;
  } catch (error) {
    logger.error('Erro ao fazer upload de arquivo de contatos', error);
    throw error;
  }
}

/**
 * Faz upload de briefing de reunião
 */
export async function uploadBriefing(
  briefingContent: string,
  contactId: string,
  meetingId: string
): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `briefings/${contactId}/${meetingId}-${timestamp}.md`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: briefingContent,
        ContentType: 'text/markdown'
      })
    );

    logger.info('Briefing enviado para S3', {
      bucket: BUCKET_NAME,
      key,
      contactId,
      meetingId
    });

    return key;
  } catch (error) {
    logger.error('Erro ao fazer upload de briefing', error);
    throw error;
  }
}

export const s3Helper = {
  uploadMessageLog,
  uploadContactsFile,
  uploadBriefing
};
