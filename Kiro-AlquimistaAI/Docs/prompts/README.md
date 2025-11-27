# Prompts e Auditorias - AlquimistaAI

## Estrutura

Esta pasta contém prompts oficiais e documentação de auditoria para o sistema AlquimistaAI.

### Subpastas

#### `/auditoria/`

Contém documentação de auditoria para etapas críticas do sistema, garantindo rastreabilidade e transparência sobre alterações automáticas.

**Arquivos:**
- `LEADS_CONSOLIDADOS_TELEFONES_EMAILS_AUDITORIA.md` - Auditoria da etapa de consolidação de leads

## Propósito

Os arquivos de auditoria servem para:

1. **Documentar comportamentos automáticos** do Kiro IDE (Autofix)
2. **Garantir rastreabilidade** de alterações em scripts críticos
3. **Manter transparência** sobre formatações e transformações
4. **Facilitar troubleshooting** quando houver dúvidas sobre alterações

## Como Usar

Quando o Kiro IDE aplicar formatação automática em arquivos Python:

1. Consulte o arquivo de auditoria correspondente
2. Verifique se as alterações são apenas de formatação
3. Confirme que a lógica do código permanece inalterada
4. Execute testes para validar os outputs

## Integração com Specs

Os arquivos de auditoria são referenciados nas specs técnicas dos componentes correspondentes:

- Micro Agente de Disparos & Agendamentos: `.kiro/specs/micro-agente-disparo-agendamento/`

---

**Última atualização**: 2024-11-27  
**Mantido por**: Equipe AlquimistaAI
