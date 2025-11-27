# Guia de Instalação - Docker Desktop para Windows

## 🐳 Docker Desktop - Instalação Completa

### Pré-requisitos

**Requisitos do Sistema:**
- Windows 10 64-bit: Pro, Enterprise, ou Education (Build 16299 ou superior)
- Windows 11 64-bit: Home ou Pro
- Virtualização habilitada no BIOS
- Hyper-V e Containers Windows features habilitados
- Mínimo 4GB RAM (recomendado 8GB+)

### Passo 1: Download do Docker Desktop

1. **Acesse o site oficial:**
   ```
   https://www.docker.com/products/docker-desktop/
   ```

2. **Clique em "Download for Windows"**

3. **Aguarde o download do arquivo:**
   - `Docker Desktop Installer.exe` (~500MB)

### Passo 2: Instalação

1. **Execute o instalador como Administrador:**
   - Clique com botão direito no arquivo baixado
   - Selecione "Executar como administrador"

2. **Siga o assistente de instalação:**
   - Aceite os termos de licença
   - Mantenha as configurações padrão
   - Aguarde a instalação (pode demorar alguns minutos)

3. **Reinicie o computador quando solicitado**

### Passo 3: Configuração Inicial

1. **Inicie o Docker Desktop:**
   - Procure por "Docker Desktop" no menu Iniciar
   - Execute o aplicativo

2. **Aceite os termos de serviço**

3. **Configure sua conta (opcional):**
   - Você pode pular este passo clicando "Continue without signing in"

4. **Aguarde a inicialização:**
   - O Docker precisa baixar e configurar componentes
   - Isso pode levar alguns minutos na primeira execução

### Passo 4: Verificação da Instalação

**Abra o PowerShell e execute:**

```powershell
# Verificar versão do Docker
docker --version

# Verificar se o Docker está rodando
docker info

# Teste básico
docker run hello-world
```

**Saída esperada:**
```
Docker version 24.0.x, build xxxxxxx

Hello from Docker!
This message shows that your installation appears to be working correctly.
```

### Passo 5: Configurações Recomendadas

1. **Abra as configurações do Docker Desktop:**
   - Clique no ícone do Docker na bandeja do sistema
   - Selecione "Settings"

2. **Ajuste os recursos (Resources > Advanced):**
   - **CPUs:** 2-4 cores (dependendo do seu sistema)
   - **Memory:** 4-8 GB
   - **Swap:** 1-2 GB
   - **Disk image size:** 60+ GB

3. **Habilite Kubernetes (opcional):**
   - Vá em "Kubernetes"
   - Marque "Enable Kubernetes"
   - Clique "Apply & Restart"

### Passo 6: Testar com OWASP ZAP

**Agora você pode executar o scan de segurança:**

```powershell
# Navegar para o diretório do projeto
cd C:\Users\Usuário\Downloads\Marcello\AlquimistaAI\Kiro-AlquimistaAI

# Executar o scan OWASP ZAP
.\tests\security\owasp-zap-scan.ps1 -Target "https://api-dev.alquimista.ai"
```

## 🛠️ Troubleshooting

### Problema: "Docker Desktop failed to start"

**Solução 1 - Habilitar Virtualização:**
1. Reinicie o computador
2. Entre no BIOS/UEFI (geralmente F2, F12, ou Del durante a inicialização)
3. Procure por "Virtualization Technology" ou "Intel VT-x" ou "AMD-V"
4. Habilite a opção
5. Salve e saia do BIOS

**Solução 2 - Habilitar Hyper-V:**
```powershell
# Execute como Administrador
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All
```

**Solução 3 - Habilitar WSL 2:**
```powershell
# Execute como Administrador
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

### Problema: "WSL 2 installation is incomplete"

**Solução:**
1. Baixe o pacote WSL2: https://aka.ms/wsl2kernel
2. Execute o instalador
3. Reinicie o Docker Desktop

### Problema: Docker muito lento

**Solução:**
1. Aumente a memória alocada (Settings > Resources > Advanced)
2. Mova a localização dos dados para um SSD (Settings > Resources > Advanced)
3. Desabilite antivírus em tempo real para a pasta do Docker

### Problema: "Access denied" ao executar comandos

**Solução:**
```powershell
# Adicionar usuário ao grupo docker-users
net localgroup docker-users "SEU_USUARIO" /add
```

## 🚀 Comandos Úteis

### Gerenciamento Básico
```powershell
# Listar containers rodando
docker ps

# Listar todas as imagens
docker images

# Parar todos os containers
docker stop $(docker ps -q)

# Remover containers parados
docker container prune

# Remover imagens não utilizadas
docker image prune

# Limpar tudo (cuidado!)
docker system prune -a
```

### Monitoramento
```powershell
# Ver uso de recursos
docker stats

# Ver logs de um container
docker logs CONTAINER_ID

# Executar comando em container rodando
docker exec -it CONTAINER_ID bash
```

## 📋 Checklist Pós-Instalação

- [ ] Docker Desktop iniciando automaticamente
- [ ] Comando `docker --version` funcionando
- [ ] Teste `docker run hello-world` executado com sucesso
- [ ] Recursos adequados alocados (CPU/RAM)
- [ ] OWASP ZAP scan executando sem erros

## 🔗 Links Úteis

- **Docker Desktop:** https://www.docker.com/products/docker-desktop/
- **Documentação:** https://docs.docker.com/desktop/windows/
- **WSL 2:** https://docs.microsoft.com/en-us/windows/wsl/install
- **Troubleshooting:** https://docs.docker.com/desktop/troubleshoot/

## 💡 Dicas Importantes

1. **Performance:** Docker no Windows usa WSL 2, que é mais eficiente que Hyper-V
2. **Recursos:** Não aloque mais de 80% da RAM total do sistema
3. **Armazenamento:** Docker pode consumir muito espaço em disco
4. **Antivírus:** Configure exclusões para melhor performance
5. **Updates:** Mantenha o Docker Desktop sempre atualizado

## 🎯 Próximos Passos

Após instalar o Docker:

1. **Executar testes de segurança:**
   ```powershell
   .\tests\security\owasp-zap-scan.ps1 -Target "https://api-dev.alquimista.ai"
   ```

2. **Instalar dependências do projeto:**
   ```powershell
   npm install
   ```

3. **Executar testes de performance:**
   ```powershell
   .\tests\load\run-tests.ps1 -TestType load
   ```

---

**Precisa de ajuda?** 
- Consulte a documentação oficial do Docker
- Verifique os logs do Docker Desktop
- Execute `docker system info` para diagnóstico
