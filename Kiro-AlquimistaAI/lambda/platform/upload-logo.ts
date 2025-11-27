import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_LOGOS_BUCKET || 'alquimistaai-logos';
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

interface UploadLogoRequest {
  tenantId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * Handler para upload de logomarca da empresa
 * Gera URL pré-assinada para upload direto ao S3
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Parse do body
    if (!event.body) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Body da requisição é obrigatório'
        })
      };
    }

    const body: UploadLogoRequest = JSON.parse(event.body);
    const { tenantId, fileName, fileType, fileSize } = body;

    // Validações
    if (!tenantId || !fileName || !fileType || !fileSize) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Campos obrigatórios: tenantId, fileName, fileType, fileSize'
        })
      };
    }

    // Validar tipo de arquivo (apenas imagens)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(fileType.toLowerCase())) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Tipo de arquivo não permitido. Use: JPEG, PNG, WebP ou SVG'
        })
      };
    }

    // Validar tamanho (máx 2MB)
    if (fileSize > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Arquivo muito grande. Tamanho máximo: 2MB'
        })
      };
    }

    // Extrair extensão do arquivo
    const extension = fileName.split('.').pop()?.toLowerCase() || 'png';
    
    // Gerar key do S3
    const s3Key = `${tenantId}/logo.${extension}`;

    // Criar comando de upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType,
      CacheControl: 'max-age=31536000', // 1 ano
      Metadata: {
        tenantId,
        uploadedAt: new Date().toISOString()
      }
    });

    // Gerar URL pré-assinada (válida por 5 minutos)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    // URL pública do logo (após upload)
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${s3Key}`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uploadUrl,
        publicUrl,
        s3Key,
        expiresIn: 300
      })
    };

  } catch (error) {
    console.error('Erro ao gerar URL de upload:', error);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Erro ao processar upload de logomarca',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    };
  }
};
