// handler.ts - Handler principal da Lambda de ingestão
import { S3Event } from 'aws-lambda';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge';
import { Pool } from 'pg';
import { LeadsParser } from './parser';
import { LeadsTransformer } from './transformer';
import { LeadsLoader } from './loader';
import { IngestaoResult } from './types';

const s3Client = new S3Client({ region: process.env.AWS_REGION });
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

export const handler = async (event: S3Event): Promise<IngestaoResult> => {
  console.log('Evento S3 recebido:', JSON.stringify(event, null, 2));

  const parser = new LeadsParser();
  const transformer = new LeadsTransformer();
  const loader = new LeadsLoader(pool);

  const result: IngestaoResult = {
    success: false,
    arquivo: '',
    leads_processados: 0,
    telefones_criados: 0,
    emails_criados: 0,
    erros: [],
  };

  try {
    // Extrair informações do evento S3
    const record = event.Records[0];
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

    result.arquivo = key;

    console.log(`Processando arquivo: ${bucket}/${key}`);

    // 1. Baixar arquivo do S3
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const s3Response = await s3Client.send(getObjectCommand);
    const buffer = await streamToBuffer(s3Response.Body);

    console.log(`Arquivo baixado: ${buffer.length} bytes`);

    // 2. Parse XLSX
    console.log('Parseando XLSX...');
    const rows = parser.parseXLSX(buffer, key);
    console.log(`${rows.length} linhas encontradas`);

    // 3. Processar cada linha
    for (const row of rows) {
      try {
        const { lead, telefones, emails } = transformer.transform(row, key);

        // 4. Inserir no banco
        await loader.insertLead(lead, telefones, emails);

        result.leads_processados++;
        result.telefones_criados += telefones.length;
        result.emails_criados += emails.length;

        // Log a cada 100 leads
        if (result.leads_processados % 100 === 0) {
          console.log(`Processados ${result.leads_processados} leads...`);
        }
      } catch (error: any) {
        const errorMsg = `Erro na linha ${row.linha}: ${error.message}`;
        console.error(errorMsg);
        result.erros.push(errorMsg);
      }
    }

    // 5. Publicar evento de conclusão no EventBridge
    await publishIngestaoEvent(result);

    result.success = result.erros.length === 0;

    console.log('Ingestão concluída:', JSON.stringify(result, null, 2));

    return result;
  } catch (error: any) {
    console.error('Erro fatal na ingestão:', error);
    result.erros.push(`Erro fatal: ${error.message}`);
    result.success = false;
    
    // Tentar publicar evento de erro
    try {
      await publishIngestaoEvent(result);
    } catch (eventError) {
      console.error('Erro ao publicar evento de erro:', eventError);
    }
    
    throw error;
  }
};

/**
 * Converte stream para buffer
 */
async function streamToBuffer(stream: any): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Publica evento de ingestão concluída no EventBridge
 */
async function publishIngestaoEvent(result: IngestaoResult): Promise<void> {
  const command = new PutEventsCommand({
    Entries: [
      {
        Source: 'alquimista.ingestao',
        DetailType: result.success ? 'Leads Ingestao Completed' : 'Leads Ingestao Failed',
        Detail: JSON.stringify(result),
        EventBusName: process.env.EVENT_BUS_NAME || 'fibonacci-bus-dev',
      },
    ],
  });

  await eventBridgeClient.send(command);
  console.log('Evento publicado no EventBridge');
}
