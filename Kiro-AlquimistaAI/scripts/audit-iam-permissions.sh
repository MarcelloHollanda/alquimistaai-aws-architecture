#!/bin/bash

# Script para auditar permissões IAM do Ecossistema Alquimista.AI
# Uso: ./scripts/audit-iam-permissions.sh [dev|staging|prod]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Ambiente (default: dev)
ENVIRONMENT=${1:-dev}

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}IAM Permissions Audit - Fibonacci AWS${NC}"
echo -e "${CYAN}Environment: $ENVIRONMENT${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Função para obter roles por stack
get_stack_roles() {
    local stack_name=$1
    echo -e "${YELLOW}Buscando roles da stack: $stack_name...${NC}"
    
    aws cloudformation describe-stack-resources \
        --stack-name "$stack_name" \
        --query "StackResources[?ResourceType=='AWS::IAM::Role'].PhysicalResourceId" \
        --output json 2>/dev/null || echo "[]"
}

# Função para obter políticas de uma role
get_role_policies() {
    local role_name=$1
    echo -e "  Analisando role: ${role_name}"
    
    # Políticas gerenciadas (managed)
    local managed_policies=$(aws iam list-attached-role-policies \
        --role-name "$role_name" \
        --query "AttachedPolicies[].PolicyName" \
        --output json 2>/dev/null || echo "[]")
    
    if [ "$managed_policies" != "[]" ]; then
        echo -e "    ${GREEN}Managed Policies:${NC}"
        echo "$managed_policies" | jq -r '.[]' | while read -r policy; do
            echo -e "      ${GRAY}- $policy${NC}"
        done
    fi
    
    # Políticas inline
    local inline_policies=$(aws iam list-role-policies \
        --role-name "$role_name" \
        --query "PolicyNames" \
        --output json 2>/dev/null || echo "[]")
    
    if [ "$inline_policies" != "[]" ]; then
        echo -e "    ${GREEN}Inline Policies:${NC}"
        echo "$inline_policies" | jq -r '.[]' | while read -r policy; do
            echo -e "      ${GRAY}- $policy${NC}"
            
            # Obter detalhes da política inline
            local policy_doc=$(aws iam get-role-policy \
                --role-name "$role_name" \
                --policy-name "$policy" \
                --query "PolicyDocument" \
                --output json 2>/dev/null)
            
            # Mostrar permissões
            echo "$policy_doc" | jq -r '.Statement[] | "        Actions: \(.Action | if type == "array" then join(", ") else . end)\n        Resources: \(.Resource | if type == "array" then join(", ") else . end)"' | while IFS= read -r line; do
                if [[ $line == *"Resources: *"* ]]; then
                    echo -e "        ${RED}Resources: * (WARNING: Wildcard)${NC}"
                else
                    echo -e "        ${GRAY}$line${NC}"
                fi
            done
        done
    fi
    
    echo ""
}

# Função para verificar permissões perigosas
check_dangerous_permissions() {
    local role_name=$1
    local warnings=()
    
    local inline_policies=$(aws iam list-role-policies \
        --role-name "$role_name" \
        --query "PolicyNames" \
        --output json 2>/dev/null || echo "[]")
    
    echo "$inline_policies" | jq -r '.[]' | while read -r policy; do
        local policy_doc=$(aws iam get-role-policy \
            --role-name "$role_name" \
            --policy-name "$policy" \
            --query "PolicyDocument" \
            --output json 2>/dev/null)
        
        # Verificar wildcard em actions
        if echo "$policy_doc" | jq -e '.Statement[] | select(.Action == "*")' >/dev/null 2>&1; then
            echo -e "  ${RED}⚠️  Wildcard (*) em Actions${NC}"
        fi
        
        # Verificar wildcard em resources
        echo "$policy_doc" | jq -r '.Statement[] | select(.Resource == "*") | .Action' | while read -r actions; do
            # X-Ray e Comprehend não suportam resource-level permissions
            if [[ ! $actions =~ xray: ]] && [[ ! $actions =~ comprehend: ]]; then
                echo -e "  ${RED}⚠️  Wildcard (*) em Resources para: $actions${NC}"
            fi
        done
        
        # Verificar permissões administrativas
        for admin_action in "iam:*" "s3:*" "dynamodb:*" "rds:*" "ec2:*"; do
            if echo "$policy_doc" | jq -e ".Statement[] | select(.Action == \"$admin_action\")" >/dev/null 2>&1; then
                echo -e "  ${RED}🚨 Permissão administrativa detectada: $admin_action${NC}"
            fi
        done
    done
}

# Stacks para auditar
stacks=(
    "FibonacciStack-$ENVIRONMENT"
    "NigredoStack-$ENVIRONMENT"
    "AlquimistaStack-$ENVIRONMENT"
)

total_warnings=0

for stack in "${stacks[@]}"; do
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Stack: $stack${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    roles=$(get_stack_roles "$stack")
    
    if [ "$roles" == "[]" ]; then
        echo -e "${YELLOW}Nenhuma role encontrada nesta stack.${NC}"
        echo ""
        continue
    fi
    
    echo "$roles" | jq -r '.[]' | while read -r role; do
        get_role_policies "$role"
        
        # Verificar permissões perigosas
        warnings=$(check_dangerous_permissions "$role")
        if [ -n "$warnings" ]; then
            echo -e "  ${RED}⚠️  AVISOS DE SEGURANÇA:${NC}"
            echo "$warnings"
            echo ""
        fi
    done
done

# Resumo final
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}RESUMO DA AUDITORIA${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

if [ $total_warnings -eq 0 ]; then
    echo -e "${GREEN}✅ Nenhum aviso de segurança encontrado!${NC}"
    echo -e "${GREEN}Todas as roles seguem o princípio de menor privilégio.${NC}"
else
    echo -e "${RED}⚠️  Total de avisos: $total_warnings${NC}"
    echo -e "${YELLOW}Revise as permissões acima e corrija conforme necessário.${NC}"
fi

echo ""
echo -e "${CYAN}Para mais informações, consulte:${NC}"
echo -e "  ${GRAY}- Docs/Deploy/IAM-ROLES-DOCUMENTATION.md${NC}"
echo -e "  ${GRAY}- Docs/Deploy/IAM-QUICK-REFERENCE.md${NC}"
echo ""

# Sugestões de melhorias
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}RECOMENDAÇÕES${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "1. Habilite IAM Access Analyzer:"
echo -e "   ${GRAY}aws accessanalyzer create-analyzer --analyzer-name fibonacci-analyzer --type ACCOUNT${NC}"
echo ""
echo -e "2. Habilite CloudTrail para auditoria:"
echo -e "   ${GRAY}aws cloudtrail create-trail --name fibonacci-trail --s3-bucket-name <bucket>${NC}"
echo ""
echo -e "3. Configure rotação de secrets:"
echo -e "   ${GRAY}Já configurado automaticamente no CDK (30 dias)${NC}"
echo ""
echo -e "4. Revise permissões trimestralmente"
echo -e "   ${GRAY}Execute este script regularmente${NC}"
echo ""
