# Plano de Implementação

## Visão Geral

Tarefas para corrigir erros de validação no deploy da WAFStack-dev relacionados a descrições de WebACL e ARN de logging.

## Tarefas

- [x] 1. Verificar e corrigir encoding do arquivo waf-stack.ts


  - Abrir `lib/waf-stack.ts` e verificar encoding
  - Garantir que o arquivo está salvo em UTF-8
  - Verificar se há caracteres invisíveis ou BOM
  - _Requisitos: 1.1, 1.2_




- [x] 2. Atualizar descrições das WebACLs

  - [x] 2.1 Corrigir descrição da WebACL Dev

    - Localizar método `createWebACLDev()` (linha ~267)
    - Verificar descrição atual: `'WAF Web ACL para APIs Dev - Modo observacao'`
    - Se houver acentos ou caracteres especiais, substituir por ASCII puro
    - Garantir que corresponde ao regex: `^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$`
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Simplificar descrição da WebACL Prod


    - Localizar método `createWebACLProd()` (linha ~380)
    - Alterar de `'WAF Web ACL para APIs Prod - Modo bloqueio ativo'`
    - Para `'WAF Web ACL para APIs Prod - Modo bloqueio'`
    - Remover palavra "ativo" para simplificar
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_

- [x] 3. Corrigir configuração de logging usando Stack.formatArn()



  - [x] 3.1 Remover import não utilizado de ArnFormat


    - Verificar se `ArnFormat` está sendo importado mas não usado
    - Manter o import pois será usado na correção
    - _Requisitos: 3.1, 3.3_

  - [x] 3.2 Criar ARN correto para logging Dev usando formatArn()




    - Localizar a linha onde `wafLogGroupDevArnForWaf` é definido (linha ~145)
    - Substituir construção manual do ARN por `cdk.Stack.of(this).formatArn()`
    - Usar `ArnFormat.COLON_RESOURCE_NAME` para formato correto
    - Usar `this.logGroupDev.logGroupName` como resourceName
    - Garantir que não há sufixo `:*` no ARN final
    - _Requisitos: 3.1, 3.3, 3.4_

  - [x] 3.3 Criar ARN correto para logging Prod usando formatArn()


    - Localizar a linha onde `wafLogGroupProdArnForWaf` é definido (linha ~169)
    - Substituir construção manual do ARN por `cdk.Stack.of(this).formatArn()`
    - Usar `ArnFormat.COLON_RESOURCE_NAME` para formato correto
    - Usar `this.logGroupProd.logGroupName` como resourceName
    - Garantir que não há sufixo `:*` no ARN final
    - _Requisitos: 3.2, 3.3, 3.4_

  - [x] 3.4 Remover overrides de LogDestinationConfigs se existirem


    - Procurar por `addPropertyOverride` ou `addOverride` relacionados a `logDestinationConfigs`
    - Remover esses overrides se existirem
    - A propriedade `logDestinationConfigs` deve ser a única fonte de verdade
    - _Requisitos: 3.3, 3.5_

  - [x] 3.5 Buscar e remover qualquer referência a `:*` no arquivo

    - Procurar por `alquimista-dev:*` no arquivo
    - Procurar por `alquimista-prod:*` no arquivo
    - Procurar por `:/aws/waf/alquimista-dev:*`
    - Procurar por `:/aws/waf/alquimista-prod:*`
    - Remover ou substituir todas as ocorrências encontradas
    - _Requisitos: 3.1, 3.2, 3.4, 3.5_

- [x] 4. Limpar cache e compilar


  - Remover diretório `cdk.out/` se existir
  - Executar `npm run build`
  - Verificar que compilação completa sem erros TypeScript
  - Verificar que não há warnings sobre imports não utilizados
  - _Requisitos: 4.1_

- [x] 5. Sintetizar template CDK


  - Executar `npx cdk synth WAFStack-dev --context env=dev`
  - Verificar que não há erros de validação de descrição
  - Verificar que não há erros de validação de ARN
  - Confirmar que template CloudFormation é gerado
  - Inspecionar o template gerado para confirmar formato correto do ARN
  - _Requisitos: 4.2, 4.4, 4.5_

- [x] 6. Deploy da stack em DEV



  - Executar `npx cdk deploy WAFStack-dev --context env=dev --require-approval never`
  - Monitorar saída do deploy
  - Verificar que não há erro de regex em description
  - Verificar que não há erro de ARN inválido em LOG_DESTINATION
  - Confirmar que deploy completa com sucesso
  - _Requisitos: 4.3, 4.4, 4.5_

- [ ] 6.1 (Opcional) Deploy da stack em PROD
  - Executar `npx cdk deploy WAFStack-prod --context env=prod --require-approval never`
  - Monitorar saída do deploy
  - Verificar que não há erros
  - Confirmar que deploy completa com sucesso
  - _Requisitos: 4.3, 4.4, 4.5_

- [ ] 7. Validar recursos criados
  - Verificar que WebACL Dev foi criada/atualizada
  - Verificar que WebACL Prod foi criada/atualizada
  - Verificar que Log Groups estão configurados
  - Verificar que Logging Configuration está ativa
  - Confirmar que alarmes CloudWatch estão funcionando
  - _Requisitos: 3.4, 3.5_

## Notas de Implementação

### Regex de Validação AWS

```regex
^[\w+=:#@/\-,\.][\w+=:#@/\-,\.\s]+[\w+=:#@/\-,\.]$
```

**Caracteres Permitidos:**
- Letras: a-z, A-Z
- Números: 0-9
- Underscore: _
- Símbolos: + = : # @ / - , .
- Espaços (no meio da string)

**Caracteres NÃO Permitidos:**
- Acentos: á, é, í, ó, ú, ã, õ, ç
- Parênteses: ( )
- Colchetes: [ ]
- Chaves: { }
- Outros caracteres especiais

### Descrições Corretas

**Dev:**
```typescript
'WAF Web ACL para APIs Dev - Modo observacao'
```

**Prod:**
```typescript
'WAF Web ACL para APIs Prod - Modo bloqueio'
```

### Formato Correto do ARN de Logging

**Problema:** O WAF não aceita ARNs de Log Group com sufixo `:*`

**Solução:** Usar `Stack.formatArn()` com `ArnFormat.COLON_RESOURCE_NAME`

**Código Correto:**
```typescript
// Para Dev
const wafLogGroupDevArnForWaf = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: this.logGroupDev.logGroupName,
});

// Para Prod
const wafLogGroupProdArnForWaf = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: this.logGroupProd.logGroupName,
});
```

**ARN Gerado (esperado):**
```
arn:aws:logs:us-east-1:<ACCOUNT_ID>:log-group:/aws/waf/alquimista-dev
arn:aws:logs:us-east-1:<ACCOUNT_ID>:log-group:/aws/waf/alquimista-prod
```

**Nota:** O formato `COLON_RESOURCE_NAME` gera `resource:resourceName` sem o sufixo `:*`

### Exemplo de Código Completo

**Localização no arquivo:** Após a criação dos Log Groups (linhas ~120-130)

```typescript
// ========================================
// 5. Logging Configuration
// ========================================

// Construir ARN correto para WAF usando Stack.formatArn
// IMPORTANTE: WAF requer formato sem :* no final
const wafLogGroupDevArnForWaf = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: this.logGroupDev.logGroupName,
});

const wafLogGroupProdArnForWaf = cdk.Stack.of(this).formatArn({
  service: 'logs',
  resource: 'log-group',
  arnFormat: ArnFormat.COLON_RESOURCE_NAME,
  resourceName: this.logGroupProd.logGroupName,
});

// Configurar logging para Web ACL Dev
const loggingDev = new wafv2.CfnLoggingConfiguration(this, 'WAFLoggingDev', {
  resourceArn: this.webAclDev.attrArn,
  logDestinationConfigs: [wafLogGroupDevArnForWaf],
});

// Redacted fields para Dev
loggingDev.addPropertyOverride('RedactedFields', [
  {
    SingleHeader: {
      Name: 'authorization',
    },
  },
  {
    SingleHeader: {
      Name: 'cookie',
    },
  },
]);

// Configurar logging para Web ACL Prod
const loggingProd = new wafv2.CfnLoggingConfiguration(this, 'WAFLoggingProd', {
  resourceArn: this.webAclProd.attrArn,
  logDestinationConfigs: [wafLogGroupProdArnForWaf],
});

// Redacted fields para Prod
loggingProd.addPropertyOverride('RedactedFields', [
  {
    SingleHeader: {
      Name: 'authorization',
    },
  },
  {
    SingleHeader: {
      Name: 'cookie',
    },
  },
]);
```

### Comandos de Validação

```bash
# 1. Limpar cache
rm -rf cdk.out

# 2. Compilar
npm run build

# 3. Sintetizar
npx cdk synth WAFStack-dev --context env=dev

# 4. Deploy DEV
npx cdk deploy WAFStack-dev --context env=dev --require-approval never

# 5. (Opcional) Deploy PROD
npx cdk deploy WAFStack-prod --context env=prod --require-approval never
```

### Saída Esperada

**Build:**
```
✅ Compilation successful
```

**Synth:**
```
✅ Successfully synthesized to cdk.out
```

**Deploy:**
```
✅ WAFStack-dev: deploying...
✅ WAFStack-dev: creating CloudFormation changeset...
✅ WAFStack-dev: deployment complete
```

### Tratamento de Erros

**Se erro de descrição persistir:**
1. Copiar descrição do erro exata
2. Verificar caracteres invisíveis com editor hex
3. Reescrever descrição manualmente
4. Testar regex localmente antes de deploy

**Se erro de ARN persistir:**
1. Verificar que `logGroupArn` não tem `:*`
2. Imprimir ARN no console para debug
3. Verificar que Log Group foi criado antes
4. Adicionar dependência explícita se necessário

## Critérios de Conclusão

- ✅ Arquivo `lib/waf-stack.ts` atualizado
- ✅ Descrições usam apenas ASCII
- ✅ Descrições passam no regex AWS
- ✅ ARN de logging está correto
- ✅ `npm run build` completa sem erros
- ✅ `cdk synth` completa sem erros
- ✅ `cdk deploy` completa com sucesso
- ✅ Recursos WAF criados/atualizados na AWS
- ✅ Logging configurado e funcionando
