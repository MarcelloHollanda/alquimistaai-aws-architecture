# Auditoria – Etapa `Leads_Consolidados_Telefones_Emails`

## Contexto (adicionado pelo Kiro)

### Localização no Fluxo

Esta auditoria é aplicada na etapa intermediária de consolidação de leads (`Leads_Consolidados_Telefones_Emails`), que ocorre **antes** da ingestão pelo Micro Agente de Disparos & Agendamentos.

**Fluxo completo:**
```
Planilhas de Origem (Telefones 1, 2, 3)
         ↓
[ETAPA ATUAL] consolida_telefones_emails.py
         ↓
Leads_Consolidados_Telefones_Emails_DEDUP.xlsx
         ↓
Organizador de Leads (v6)
         ↓
Leads_Organizados.xlsx
         ↓
Micro Agente de Disparos & Agendamentos
```

### Script Responsável

- **Arquivo**: `consolida_telefones_emails.py` (raiz do projeto)
- **Entrada**: 
  - `Planilha Telefones 1.xlsx.xlsx`
  - `Planilha Telefones 2.xlsx.xlsx`
  - `Planilha Telefones.xlsx.xlsx`
- **Saída**:
  - `Leads_Consolidados_Telefones_Emails_DEDUP.xlsx` (formatado)
  - `Leads_Consolidados_Telefones_Emails_DEDUP.csv`

### Objetivo da Auditoria

Garantir entendimento e rastreabilidade de alterações de formatação realizadas pelo Kiro IDE (Autofix) em scripts Python desta etapa, mantendo a transparência sobre:

1. Quais formatações são aplicadas automaticamente
2. Por que essas formatações ocorrem
3. Como configurar ou desabilitar se necessário
4. Que essas formatações não alteram a lógica do código

---

## Prompt de Auditoria (conteúdo fornecido pelo fundador – não alterar)

### O que está acontecendo:

O Kiro IDE possui um recurso chamado **Autofix** que automaticamente:

1. Formata o código segundo padrões de estilo
2. Corrige problemas de indentação
3. Ajusta espaçamentos
4. Aplica convenções de formatação da linguagem

### No caso do Python:

- Provavelmente está usando formatadores como `black`, `autopep8` ou similar
- Ajusta espaçamentos, quebras de linha, etc.

### Arquivos de configuração que PODEM influenciar (se existirem):

- `.editorconfig` - Configurações gerais de editor
- `pyproject.toml` - Configurações de ferramentas Python
- `.vscode/settings.json` - Configurações do VS Code/Kiro

### Mas neste projeto:

Não há arquivos específicos configurando isso. É o comportamento padrão do Kiro IDE aplicando formatação automática ao salvar arquivos Python.

### Isso é bom ou ruim?

✅ **Bom** - Mantém o código consistente e legível  
✅ Não altera a lógica, apenas a aparência  
✅ Segue padrões da comunidade Python (PEP 8)

Se quiser desabilitar, você pode ajustar nas configurações do Kiro IDE, mas geralmente é recomendado manter ativo.

---

## Checklist de Auditoria

Ao revisar alterações no script `consolida_telefones_emails.py`, verificar:

- [ ] As alterações são apenas de formatação (espaçamento, indentação)?
- [ ] A lógica do código permanece inalterada?
- [ ] Os outputs gerados (XLSX e CSV) continuam corretos?
- [ ] As funções de validação e formatação (CNPJ, telefone) funcionam como esperado?
- [ ] O número de registros consolidados está consistente?

---

## Integração com Micro Agente

Este arquivo de auditoria está referenciado em:

- `.kiro/specs/micro-agente-disparo-agendamento/SPEC-TECNICA.md`
- `.kiro/specs/micro-agente-disparo-agendamento/FLUXO-INGESTAO-LEADS.md`

Para mais detalhes sobre o fluxo completo, consulte:
- [Fluxo de Ingestão de Leads](../../.kiro/specs/micro-agente-disparo-agendamento/FLUXO-INGESTAO-LEADS.md)

---

**Última atualização**: 2024-11-27  
**Versão**: 1.0.0  
**Mantido por**: Equipe AlquimistaAI
