# Plano de Implementação

- [x] 1. Implementar função de validação de descrições WAF


  - Criar constante `WAF_DESCRIPTION_REGEX` com o padrão regex exigido pela AWS
  - Implementar função `validateWafDescription` que valida descrições contra o regex
  - Adicionar mensagem de erro clara indicando caracteres permitidos e proibidos
  - Adicionar comentários explicando as restrições do AWS WAFv2
  - _Requisitos: 1.1, 1.2, 4.2_

- [x] 2. Corrigir descrições dos IP Sets no WAFStack


  - [x] 2.1 Atualizar descrição do IP Set Allowlist


    - Substituir descrição atual por: `'Allowlist de IPs confiaveis - escritorios, CI/CD e health checks'`
    - Aplicar função `validateWafDescription` na descrição
    - Verificar que não há acentos, parênteses ou caracteres inválidos
    - _Requisitos: 1.1, 1.3, 1.4, 1.5_
  
  - [x] 2.2 Atualizar descrição do IP Set Blocklist


    - Substituir descrição atual por: `'Blocklist de IPs maliciosos identificados'`
    - Aplicar função `validateWafDescription` na descrição
    - Verificar que não há acentos, parênteses ou caracteres inválidos
    - _Requisitos: 1.2, 1.3, 1.4, 1.5_

- [x] 3. Validar correções via CDK synth


  - [x] 3.1 Compilar código TypeScript


    - Executar `npm run build`
    - Verificar que não há erros de compilação
    - _Requisitos: 2.1_
  
  - [x] 3.2 Sintetizar template CloudFormation para dev


    - Executar `npx cdk synth WAFStack-dev --context env=dev`
    - Verificar que não há erros de validação
    - Confirmar que template é gerado com sucesso
    - _Requisitos: 2.1, 2.3_
  
  - [x] 3.3 Sintetizar template CloudFormation para prod


    - Executar `npx cdk synth WAFStack-prod --context env=prod`
    - Verificar que não há erros de validação
    - Confirmar que template é gerado com sucesso
    - _Requisitos: 2.1, 2.3_

- [-] 4. Realizar deploy das correções

  - [x] 4.1 Deploy em ambiente dev


    - Executar `npx cdk deploy WAFStack-dev --context env=dev`
    - Verificar que deploy completa sem erros
    - Confirmar código de status 0
    - _Requisitos: 2.2, 2.3_
  
  - [ ] 4.2 Verificar IP Sets no console AWS
    - Acessar console AWS WAF na região us-east-1
    - Verificar que IP Sets foram criados/atualizados
    - Confirmar que descrições estão corretas e sem caracteres inválidos
    - _Requisitos: 2.4_
  
  - [ ] 4.3 Deploy em ambiente prod
    - Executar `npx cdk deploy WAFStack-prod --context env=prod`
    - Verificar que deploy completa sem erros
    - Confirmar alinhamento entre dev e prod
    - _Requisitos: 2.2, 2.3, 2.4_

- [x] 5. Documentar mudanças e diretrizes



  - [x] 5.1 Criar documento de diretrizes WAF


    - Criar ou atualizar `docs/WAF-DESCRIPTIONS-GUIDELINES.md`
    - Documentar padrão regex aceito pela AWS WAFv2
    - Incluir lista de caracteres permitidos e proibidos
    - Adicionar exemplos de descrições válidas e inválidas
    - _Requisitos: 3.1, 3.2, 3.4_
  
  - [x] 5.2 Atualizar documentação de segurança


    - Atualizar `docs/SECURITY-GUARDRAILS-AWS.md` com referência às novas diretrizes
    - Adicionar seção sobre validação de descrições WAF
    - Incluir link para documento de diretrizes
    - _Requisitos: 3.4_

- [ ] 6. Implementar testes automatizados
  - Criar arquivo de teste para função `validateWafDescription`
  - Implementar teste que valida descrições corretas
  - Implementar teste que rejeita descrições com acentos
  - Implementar teste que rejeita descrições com parênteses
  - Implementar teste que rejeita outros caracteres inválidos
  - _Requisitos: 4.1, 4.4_

- [ ] 7. Validação final e documentação de conclusão
  - Verificar que todos os requisitos foram atendidos
  - Confirmar que deploy funciona em dev (e opcionalmente prod)
  - Verificar que documentação está completa e atualizada
  - Criar resumo de implementação com resultados
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4_
