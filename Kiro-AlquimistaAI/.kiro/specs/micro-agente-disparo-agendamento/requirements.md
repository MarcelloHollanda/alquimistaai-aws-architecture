# Requirements · Micro Agente de Disparos & Agendamentos

## Versão: v0.1

## 1. Visão Geral

O Micro Agente de Disparos & Agendamentos é responsável por:

1. **Ingerir leads** a partir da planilha oficial `Leads_Organizados.xlsx` (aba `Leads`)
2. **Normalizar** emails e telefones em estruturas internas (`leads`, `lead_emails`, `lead_telefones`)
3. **Orquestrar disparos** (WhatsApp / Email) e **agendamentos** (ex.: callbacks, reuniões)
4. Manter **rastreabilidade** até a origem da planilha (arquivo + linha)

> **Fonte oficial de dados**: Saída do **Organizador de Leads**, com colunas fixas:
> `Nome`, `Contato`, `CNPJ/CPF`, `Email`, `Telefone`

---

## 2. Requisitos Funcionais

### RF-01: Ingestão de Planilha

**Descrição**: O sistema deve processar arquivos `Leads_Organizados.xlsx` e criar registros normalizados de leads.

**Critérios de Aceitação**:
- ✅ Aceitar upload direto (multipart) ou referência S3
- ✅ Processar aba "Leads" com colunas fixas
- ✅ Criar registro único por linha da planilha
- ✅ Manter rastreabilidade (arquivo + linha)
- ✅ Retornar job_id para acompanhamento assíncrono

**Prioridade**: Alta

---

### RF-02: Normalização de Contatos

**Descrição**: O sistema deve extrair e normalizar múltiplos emails e telefones de cada lead.

**Critérios de Aceitação**:
- ✅ Separar emails por delimitador " | "
- ✅ Separar telefones por delimitador " | "
- ✅ Marcar primeiro email/telefone como principal
- ✅ Validar formato de telefone (+55 DDD NÚMERO)
- ✅ Marcar contatos válidos para disparo

**Prioridade**: Alta

---

### RF-03: Disparo de Mensagens

**Descrição**: O sistema deve permitir disparos via WhatsApp ou Email para leads específicos.

**Critérios de Aceitação**:
- ✅ Suportar canais: WhatsApp e Email
- ✅ Usar templates pré-definidos com variáveis
- ✅ Permitir agendamento futuro de disparo
- ✅ Registrar status (pendente, enviado, erro)
- ✅ Integrar com MCP WhatsApp e MCP Email

**Prioridade**: Alta

---

### RF-04: Agendamento de Contatos

**Descrição**: O sistema deve permitir agendar callbacks e reuniões com leads.

**Critérios de Aceitação**:
- ✅ Suportar tipos: callback, reunião
- ✅ Suportar canais: telefone, whatsapp, vídeo
- ✅ Registrar data/hora agendada
- ✅ Permitir observações livres
- ✅ Rastrear status (pendente, realizado, cancelado)

**Prioridade**: Média

---

### RF-05: Consulta de Leads

**Descrição**: O sistema deve permitir listagem e busca de leads ingeridos.

**Critérios de Aceitação**:
- ✅ Filtrar por status (novo, em_disparo, agendado, etc.)
- ✅ Paginação (limit, offset)
- ✅ Retornar dados resumidos do lead
- ✅ Incluir contagem total de resultados

**Prioridade**: Média

---

### RF-06: Rastreabilidade de Origem

**Descrição**: Todo lead deve manter referência à linha original da planilha.

**Critérios de Aceitação**:
- ✅ Campo `lead_id_externo` no formato "arquivo:linha"
- ✅ Campos `origem_arquivo`, `origem_aba`, `linha_planilha`
- ✅ Imutabilidade desses campos após criação

**Prioridade**: Alta

---

## 3. Requisitos Não-Funcionais

### RNF-01: Performance

- Processar até 200.000 linhas de planilha em menos de 5 minutos
- Suportar até 1.000 disparos simultâneos
- Tempo de resposta da API < 500ms (exceto ingestão)

### RNF-02: Escalabilidade

- Arquitetura serverless (Lambda + Aurora Serverless v2)
- Auto-scaling baseado em demanda
- Processamento assíncrono para ingestão

### RNF-03: Confiabilidade

- Retry automático em falhas de disparo (até 3 tentativas)
- Dead Letter Queue para erros persistentes
- Logs estruturados para auditoria

### RNF-04: Segurança

- Autenticação via Cognito
- Autorização por tenant (multi-tenant)
- Criptografia em trânsito (TLS 1.3)
- Criptografia em repouso (Aurora KMS)

### RNF-05: Observabilidade

- Métricas CloudWatch customizadas
- Alarmes para taxa de erro > 5%
- Logs estruturados em JSON
- Tracing com X-Ray

---

## 4. Regras de Negócio

### RN-01: Herança do Organizador de Leads

O sistema **DEVE** respeitar as transformações já aplicadas pelo Organizador:

- **Nome**: Já vem sem prefixos numéricos (ex.: `000011-`)
- **Contato**: Já é o prefixo do primeiro email
- **CNPJ/CPF**: Apenas dígitos, nunca usado como telefone
- **Email**: Pode conter múltiplos valores separados por " | "
- **Telefone**: Já padronizado para `+55 DDD NÚMERO` quando possível

### RN-02: Validação de Telefone para Disparo

Um telefone é considerado **válido para disparo** se:

1. Começa com `+55`
2. Possui 2 dígitos de DDD
3. Possui 8 ou 9 dígitos de número

Formato: `+55 DD NNNNNNNNN` ou `+55 DD NNNNNNNN`

### RN-03: Máquina de Estados do Lead

Estados possíveis:

- `novo`: Recém-ingerido, nenhum disparo ainda
- `em_disparo`: Existe disparo pendente ou em andamento
- `agendado`: Existe agendamento futuro relevante
- `contato_efetuado`: Houve contato bem-sucedido
- `sem_sucesso`: Esgotou tentativas sem resposta
- `descartado`: Lead inválido (número inexistente, email bounce)
- `concluido`: Ciclo de cobrança/atendimento encerrado

### RN-04: Priorização de Contatos

Quando um lead possui múltiplos emails/telefones:

1. O primeiro da lista é marcado como `principal = true`
2. Disparos devem priorizar contatos principais
3. Contatos secundários são usados em caso de falha

---

## 5. Integrações Externas

### INT-01: MCP WhatsApp

- **Operação**: Envio de mensagens via WhatsApp Business API
- **Dependência**: MCP Server WhatsApp configurado
- **Timeout**: 30 segundos

### INT-02: MCP Email

- **Operação**: Envio de emails transacionais
- **Dependência**: MCP Server Email configurado
- **Timeout**: 30 segundos

### INT-03: MCP Calendar (Futuro)

- **Operação**: Criação de eventos de calendário
- **Dependência**: MCP Server Calendar configurado
- **Prioridade**: Baixa (Fase 2)

---

## 6. Restrições e Limitações

### Limitações Conhecidas

1. **Formato de Planilha**: Apenas `.xlsx` com estrutura fixa
2. **Tamanho Máximo**: 500 MB por arquivo
3. **Linhas Máximas**: 1.000.000 por arquivo
4. **Rate Limiting**: 100 disparos/minuto por tenant

### Restrições Técnicas

1. **Região AWS**: us-east-1 (obrigatório)
2. **Runtime Lambda**: Node.js 20
3. **Banco de Dados**: Aurora PostgreSQL Serverless v2
4. **Multi-tenant**: Isolamento por `tenant_id`

---

## 7. Casos de Uso Principais

### UC-01: Importar Leads da Planilha

**Ator**: Sistema de Cobrança / Operador

**Fluxo Principal**:
1. Sistema faz upload de `Leads_Organizados.xlsx`
2. API retorna `job_id`
3. Sistema processa planilha assincronamente
4. Para cada linha: cria lead + emails + telefones
5. Atualiza status do job para "concluído"

**Fluxo Alternativo**:
- Se linha inválida: registra erro e continua
- Se arquivo corrompido: falha o job inteiro

---

### UC-02: Disparar Mensagem de Cobrança

**Ator**: Sistema de Cobrança

**Fluxo Principal**:
1. Sistema identifica lead com débito
2. Seleciona template de mensagem
3. Cria disparo via API (WhatsApp ou Email)
4. Sistema agenda envio (imediato ou futuro)
5. MCP Server processa envio
6. Status atualizado para "enviado" ou "erro"

**Fluxo Alternativo**:
- Se contato inválido: marca como descartado
- Se falha temporária: agenda retry

---

### UC-03: Agendar Callback

**Ator**: Operador de Cobrança

**Fluxo Principal**:
1. Operador visualiza lead
2. Cria agendamento de callback
3. Define data/hora e canal
4. Sistema registra agendamento
5. Sistema notifica operador no horário agendado

---

## 8. Glossário

- **Lead**: Registro de pessoa/empresa a ser contatada
- **Disparo**: Envio de mensagem via WhatsApp ou Email
- **Agendamento**: Compromisso futuro de contato
- **Template**: Modelo de mensagem com variáveis
- **MCP Server**: Model Context Protocol Server (integração externa)
- **Job**: Processo assíncrono de ingestão de planilha

---

## 9. Referências

- [Blueprint Disparo & Agendamento](../../../.kiro/steering/blueprint-disparo-agendamento.md)
- [Fluxo de Ingestão de Leads](./FLUXO-INGESTAO-LEADS.md)
- [Contexto do Projeto Alquimista](../../../.kiro/steering/contexto-projeto-alquimista.md)

---

**Última Atualização**: 2024-11-26  
**Versão**: 0.1  
**Status**: Rascunho  
**Mantido por**: Equipe AlquimistaAI
