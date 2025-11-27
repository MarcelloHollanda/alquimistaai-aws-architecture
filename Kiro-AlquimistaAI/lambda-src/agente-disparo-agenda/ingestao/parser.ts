// parser.ts - Parser de arquivos XLSX
import * as XLSX from 'xlsx';
import { LeadRow } from './types';

export class LeadsParser {
  /**
   * Parse XLSX file from S3 buffer
   */
  parseXLSX(buffer: Buffer, nomeArquivo: string): LeadRow[] {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    
    // Validar que existe aba "Leads"
    if (!workbook.SheetNames.includes('Leads')) {
      throw new Error('Aba "Leads" não encontrada no arquivo');
    }

    const worksheet = workbook.Sheets['Leads'];
    const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

    // Primeira linha é header
    const headers = data[0] as string[];
    this.validateHeaders(headers);

    const leads: LeadRow[] = [];

    // Processar linhas (começando da linha 2, índice 1)
    for (let i = 1; i < data.length; i++) {
      const row = data[i] as any[];
      
      // Pular linhas vazias
      if (!row || row.length === 0 || !row[0]) {
        continue;
      }

      leads.push({
        linha: i + 1, // Linha real no Excel (1-indexed)
        nome: this.cleanString(row[0]),
        contato: this.cleanString(row[1]),
        documento: this.cleanDocumento(row[2]),
        email: this.cleanString(row[3]),
        telefone: this.cleanString(row[4]),
      });
    }

    return leads;
  }

  /**
   * Valida headers obrigatórios
   */
  private validateHeaders(headers: string[]): void {
    const required = ['Nome', 'Contato', 'CNPJ/CPF', 'Email', 'Telefone'];
    
    for (let i = 0; i < required.length; i++) {
      if (headers[i] !== required[i]) {
        throw new Error(
          `Header inválido na coluna ${i + 1}. ` +
          `Esperado: "${required[i]}", Encontrado: "${headers[i]}"`
        );
      }
    }
  }

  /**
   * Limpa string removendo espaços extras
   */
  private cleanString(value: any): string {
    if (!value) return '';
    return String(value).trim();
  }

  /**
   * Limpa documento removendo tudo que não é dígito
   */
  private cleanDocumento(value: any): string {
    if (!value) return '';
    return String(value).replace(/\D/g, '');
  }
}
