**📱 Instruções de Implementação \- Frontend**   
**Evolution HTTP \+ Pacing Avançado \+ Failover Automático**  
**Data: 14 de Outubro de 2025**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**🎯 Objetivo**  
**Integrar as melhorias de Evolution Cloud HTTP, Pacing Avançado e Failover Automático no dashboard, expandindo a aba Monitoramento existente com novas funcionalidades.**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**📡 Novos Endpoints Disponíveis**  
**1\. GET /api/whatsapp/pacing**  
**Retorna estatísticas de pacing em tempo real.**  
**Response:**  
**{**  
 **ok: boolean;**  
 **cap\_per\_minute: number;          // Limite configurado (ex: 30\)**  
 **sent\_this\_minute: number;        // Mensagens enviadas no minuto atual**  
 **available\_this\_minute: number;   // Disponível para enviar**  
 **window\_start: string;            // ISO timestamp do início do minuto**  
 **minute\_remaining\_ms: number;     // Milissegundos restantes no minuto**  
 **in\_allowed\_window: boolean;      // Dentro da janela de envio?**  
 **next\_window\_delay\_ms: number;    // Delay até próxima janela (0 se já está)**  
 **next\_window\_delay\_text: string;  // Texto formatado (ex: "0s", "2h 15m")**  
**}**  
**Exemplo de chamada:**  
**const { data } \= useQuery({**  
 **queryKey: \['whatsapp-pacing'\],**  
 **queryFn: async () \=\> {**  
   **const res \= await fetch(\`${import.meta.env.VITE\_API\_URL}/api/whatsapp/pacing\`);**  
   **return res.json();**  
 **},**  
 **refetchInterval: 5000 // Atualizar a cada 5s**  
**});**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**2\. GET /api/whatsapp/status (EXPANDIDO)**  
**Retorna status completo do provider \+ pacing.**  
**Response:**  
**{**  
 **ok: boolean;**  
 **provider: 'evolution\_http' | 'evolution\_local' | 'meta\_cloud';**  
 **status: string;  // 'connected', 'close', 'configured', 'error'**  
 **connected?: boolean;**  
 **instance\_id?: string;**  
 **pacing: {**  
   **cap\_per\_minute: number;**  
   **sent\_this\_minute: number;**  
   **available\_this\_minute: number;**  
   **in\_allowed\_window: boolean;**  
   **next\_window\_delay\_text: string;**  
   **// ... outros campos do /pacing**  
 **}**  
**}**  
**Exemplo de chamada:**  
**const { data } \= useQuery({**  
 **queryKey: \['whatsapp-status'\],**  
 **queryFn: async () \=\> {**  
   **const res \= await fetch(\`${import.meta.env.VITE\_API\_URL}/api/whatsapp/status\`);**  
   **return res.json();**  
 **},**  
 **refetchInterval: 10000 // Atualizar a cada 10s**  
**});**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**🎨 Componentes a Implementar/Modificar**  
**1\. Atualizar WhatsAppMonitoring.tsx**  
**Expandir o componente existente com as novas seções:**  
**1.1. Seção de Provider Ativo**  
**Mostrar qual provider está sendo usado no momento:**  
**// Novo badge para indicar provider**  
**\<div className="flex items-center gap-2"\>**  
 **\<Badge variant={getProviderVariant(data.provider)}\>**  
   **{getProviderLabel(data.provider)}**  
 **\</Badge\>**  
 **{data.instance\_id && (**  
   **\<span className="text-sm text-muted-foreground"\>**  
     **ID: {data.instance\_id}**  
   **\</span\>**  
 **)}**  
**\</div\>**  
**// Helper functions**  
**const getProviderVariant \= (provider: string) \=\> {**  
 **switch(provider) {**  
   **case 'evolution\_http': return 'default';  // Cloud \- azul**  
   **case 'evolution\_local': return 'secondary'; // Local \- cinza**  
   **case 'meta\_cloud': return 'outline';      // Meta \- outline**  
   **default: return 'destructive';            // Erro \- vermelho**  
 **}**  
**};**  
**const getProviderLabel \= (provider: string) \=\> {**  
 **switch(provider) {**  
   **case 'evolution\_http': return '☁️ Evolution Cloud';**  
   **case 'evolution\_local': return '🖥️ Evolution Local';**  
   **case 'meta\_cloud': return '📱 Meta Cloud';**  
   **default: return '❌ Desconhecido';**  
 **}**  
**};**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**1.2. Seção de Pacing Dinâmico**  
**Substituir o progress bar estático por um dinâmico:**  
**\<Card\>**  
 **\<CardHeader\>**  
   **\<CardTitle className="flex items-center gap-2"\>**  
     **\<Activity className="h-4 w-4" /\>**  
     **Rate Limiting**  
   **\</CardTitle\>**  
 **\</CardHeader\>**  
 **\<CardContent className="space-y-4"\>**  
   **{/\* Progress Bar Dinâmico \*/}**  
   **\<div className="space-y-2"\>**  
     **\<div className="flex justify-between text-sm"\>**  
       **\<span\>Enviadas neste minuto\</span\>**  
       **\<span className="font-medium"\>**  
         **{data.pacing.sent\_this\_minute}/{data.pacing.cap\_per\_minute} msgs**  
       **\</span\>**  
     **\</div\>**  
      
     **\<Progress**  
       **value={(data.pacing.sent\_this\_minute / data.pacing.cap\_per\_minute) \* 100}**  
       **className={cn(**  
         **"h-2",**  
         **(data.pacing.sent\_this\_minute / data.pacing.cap\_per\_minute) \> 0.8 && "bg-orange-200"**  
       **)}**  
     **/\>**  
      
     **\<p className="text-xs text-muted-foreground"\>**  
       **Capacidade disponível: {data.pacing.available\_this\_minute} mensagens**  
     **\</p\>**  
   **\</div\>**  
   **{/\* Alerta de Proximidade do Limite \*/}**  
   **{(data.pacing.sent\_this\_minute / data.pacing.cap\_per\_minute) \> 0.8 && (**  
     **\<Alert variant="warning"\>**  
       **\<AlertTriangle className="h-4 w-4" /\>**  
       **\<AlertTitle\>Próximo do limite\!\</AlertTitle\>**  
       **\<AlertDescription\>**  
         **Você usou {Math.round((data.pacing.sent\_this\_minute / data.pacing.cap\_per\_minute) \* 100)}%**  
         **da capacidade. O sistema pode bloquear novos envios temporariamente.**  
       **\</AlertDescription\>**  
     **\</Alert\>**  
   **)}**  
 **\</CardContent\>**  
**\</Card\>**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**1.3. Seção de Janela de Envio**  
**Adicionar indicador visual da janela de envio:**  
**\<Card\>**  
 **\<CardHeader\>**  
   **\<CardTitle className="flex items-center gap-2"\>**  
     **\<Clock className="h-4 w-4" /\>**  
     **Janela de Envio**  
   **\</CardTitle\>**  
 **\</CardHeader\>**  
 **\<CardContent className="space-y-3"\>**  
   **{/\* Status da Janela \*/}**  
   **\<div className="flex items-center justify-between"\>**  
     **\<span className="text-sm"\>Status atual:\</span\>**  
     **\<Badge variant={data.pacing.in\_allowed\_window ? "success" : "destructive"}\>**  
       **{data.pacing.in\_allowed\_window ? "🟢 Aberta" : "🔴 Fechada"}**  
     **\</Badge\>**  
   **\</div\>**  
   **{/\* Horário Configurado \*/}**  
   **\<div className="text-sm space-y-1"\>**  
     **\<div className="flex justify-between"\>**  
       **\<span className="text-muted-foreground"\>Horário:\</span\>**  
       **\<span className="font-medium"\>Seg-Sex 08:00-18:00\</span\>**  
     **\</div\>**  
     **\<div className="flex justify-between"\>**  
       **\<span className="text-muted-foreground"\>Timezone:\</span\>**  
       **\<span className="font-medium"\>America/Fortaleza\</span\>**  
     **\</div\>**  
   **\</div\>**  
   **{/\* Próxima Janela (se fechada) \*/}**  
   **{\!data.pacing.in\_allowed\_window && data.pacing.next\_window\_delay\_text && (**  
     **\<Alert\>**  
       **\<Info className="h-4 w-4" /\>**  
       **\<AlertDescription\>**  
         **Próxima janela disponível em: \<strong\>{data.pacing.next\_window\_delay\_text}\</strong\>**  
       **\</AlertDescription\>**  
     **\</Alert\>**  
   **)}**  
   **{/\* Contador de Reset \*/}**  
   **\<div className="text-xs text-muted-foreground border-t pt-2"\>**  
     **Limite reseta em: {formatMilliseconds(data.pacing.minute\_remaining\_ms)}**  
   **\</div\>**  
 **\</CardContent\>**  
**\</Card\>**  
**Helper para formatar milissegundos:**  
**const formatMilliseconds \= (ms: number): string \=\> {**  
 **const seconds \= Math.floor(ms / 1000);**  
 **if (seconds \< 60\) return \`${seconds}s\`;**  
 **const minutes \= Math.floor(seconds / 60);**  
 **const remainingSeconds \= seconds % 60;**  
 **return \`${minutes}m ${remainingSeconds}s\`;**  
**};**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**1.4. Indicador de Failover**  
**Nova seção mostrando sistema de failover:**  
**\<Card\>**  
 **\<CardHeader\>**  
   **\<CardTitle className="flex items-center gap-2"\>**  
     **\<Shield className="h-4 w-4" /\>**  
     **Sistema de Redundância**  
   **\</CardTitle\>**  
 **\</CardHeader\>**  
 **\<CardContent\>**  
   **\<div className="space-y-2"\>**  
     **\<p className="text-sm text-muted-foreground mb-3"\>**  
       **Ordem de tentativa automática:**  
     **\</p\>**  
      
     **{/\* Chain de Failover \*/}**  
     **\<div className="flex items-center gap-2 text-sm"\>**  
       **\<Badge variant={data.provider \=== 'evolution\_http' ? 'default' : 'outline'}\>**  
         **1\. Evolution HTTP**  
       **\</Badge\>**  
       **\<ArrowRight className="h-3 w-3 text-muted-foreground" /\>**  
       **\<Badge variant={data.provider \=== 'evolution\_local' ? 'default' : 'outline'}\>**  
         **2\. Evolution Local**  
       **\</Badge\>**  
       **\<ArrowRight className="h-3 w-3 text-muted-foreground" /\>**  
       **\<Badge variant={data.provider \=== 'meta\_cloud' ? 'default' : 'outline'}\>**  
         **3\. Meta Cloud**  
       **\</Badge\>**  
     **\</div\>**  
     **\<p className="text-xs text-muted-foreground pt-2"\>**  
       **✅ Se um provider falhar, o sistema tenta automaticamente o próximo**  
     **\</p\>**  
   **\</div\>**  
 **\</CardContent\>**  
**\</Card\>**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**2\. Criar Hook Customizado useWhatsAppMonitoring**  
**Para centralizar a lógica de monitoramento:**  
**// hooks/useWhatsAppMonitoring.ts**  
**import { useQuery } from '@tanstack/react-query';**  
**interface WhatsAppStatus {**  
 **ok: boolean;**  
 **provider: 'evolution\_http' | 'evolution\_local' | 'meta\_cloud';**  
 **status: string;**  
 **pacing: {**  
   **cap\_per\_minute: number;**  
   **sent\_this\_minute: number;**  
   **available\_this\_minute: number;**  
   **in\_allowed\_window: boolean;**  
   **next\_window\_delay\_text: string;**  
   **minute\_remaining\_ms: number;**  
 **};**  
**}**  
**export const useWhatsAppMonitoring \= () \=\> {**  
 **return useQuery\<WhatsAppStatus\>({**  
   **queryKey: \['whatsapp-monitoring'\],**  
   **queryFn: async () \=\> {**  
     **const res \= await fetch(**  
       **\`${import.meta.env.VITE\_API\_URL}/api/whatsapp/status\`**  
     **);**  
     **if (\!res.ok) throw new Error('Failed to fetch WhatsApp status');**  
     **return res.json();**  
   **},**  
   **refetchInterval: 5000, // 5 segundos**  
   **retry: 3,**  
   **retryDelay: (attemptIndex) \=\> Math.min(1000 \* 2 \*\* attemptIndex, 30000\)**  
 **});**  
**};**  
**Uso no componente:**  
**const WhatsAppMonitoring \= () \=\> {**  
 **const { data, isLoading, error } \= useWhatsAppMonitoring();**  
 **if (isLoading) return \<LoadingSkeleton /\>;**  
 **if (error) return \<ErrorDisplay error={error} /\>;**  
 **if (\!data) return null;**  
 **return (**  
   **\<div className="grid gap-4 md:grid-cols-2"\>**  
     **{/\* Componentes aqui \*/}**  
   **\</div\>**  
 **);**  
**};**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**3\. Adicionar Notificações em Tempo Real**  
**Usar sonner (já instalado) para alertas importantes:**  
**import { toast } from 'sonner';**  
**import { useEffect, useRef } from 'react';**  
**const WhatsAppMonitoring \= () \=\> {**  
 **const { data } \= useWhatsAppMonitoring();**  
 **const previousData \= useRef(data);**  
 **useEffect(() \=\> {**  
   **if (\!data || \!previousData.current) return;**  
   **// Alerta quando janela fecha**  
   **if (previousData.current.pacing.in\_allowed\_window && \!data.pacing.in\_allowed\_window) {**  
     **toast.warning('Janela de envio fechada', {**  
       **description: \`Próxima abertura em ${data.pacing.next\_window\_delay\_text}\`,**  
       **duration: 5000**  
     **});**  
   **}**  
   **// Alerta quando atinge 90% do limite**  
   **const usagePercent \= (data.pacing.sent\_this\_minute / data.pacing.cap\_per\_minute) \* 100;**  
   **const prevUsagePercent \= (previousData.current.pacing.sent\_this\_minute / previousData.current.pacing.cap\_per\_minute) \* 100;**  
    
   **if (prevUsagePercent \< 90 && usagePercent \>= 90\) {**  
     **toast.error('Rate limit crítico\!', {**  
       **description: \`${data.pacing.sent\_this\_minute}/${data.pacing.cap\_per\_minute} mensagens enviadas\`,**  
       **duration: 8000**  
     **});**  
   **}**  
   **// Alerta quando provider muda (failover)**  
   **if (previousData.current.provider \!== data.provider) {**  
     **toast.info('Provider alterado', {**  
       **description: \`Agora usando: ${data.provider}\`,**  
       **duration: 6000**  
     **});**  
   **}**  
   **previousData.current \= data;**  
 **}, \[data\]);**  
 **return (/\* ... \*/);**  
**};**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**📊 Página de Relatórios \- Nova Seção**  
**Adicionar seção na página /relatórios:**  
**Gráfico de Uso de Pacing**  
**import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';**  
**const PacingUsageChart \= () \=\> {**  
 **const \[history, setHistory\] \= useState\<Array\<{time: string, sent: number, limit: number}\>\>(\[\]);**  
 **const { data } \= useWhatsAppMonitoring();**  
 **useEffect(() \=\> {**  
   **if (\!data) return;**  
    
   **const newEntry \= {**  
     **time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),**  
     **sent: data.pacing.sent\_this\_minute,**  
     **limit: data.pacing.cap\_per\_minute**  
   **};**  
   **setHistory(prev \=\> \[...prev.slice(-20), newEntry\]); // Últimos 20 pontos**  
 **}, \[data\]);**  
 **return (**  
   **\<Card\>**  
     **\<CardHeader\>**  
       **\<CardTitle\>Histórico de Uso (Últimos 20 minutos)\</CardTitle\>**  
     **\</CardHeader\>**  
     **\<CardContent\>**  
       **\<LineChart width={600} height={300} data={history}\>**  
         **\<CartesianGrid strokeDasharray="3 3" /\>**  
         **\<XAxis dataKey="time" /\>**  
         **\<YAxis /\>**  
         **\<Tooltip /\>**  
         **\<Legend /\>**  
         **\<Line type="monotone" dataKey="sent" stroke="\#8884d8" name="Enviadas" /\>**  
         **\<Line type="monotone" dataKey="limit" stroke="\#82ca9d" name="Limite" strokeDasharray="5 5" /\>**  
       **\</LineChart\>**  
     **\</CardContent\>**  
   **\</Card\>**  
 **);**  
**};**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**🔧 Configurações \- Nova Seção**  
**Na aba Monitoramento da página /config, adicionar:**  
**Configuração de Pacing**  
**\<Card\>**  
 **\<CardHeader\>**  
   **\<CardTitle\>Configuração de Rate Limiting\</CardTitle\>**  
   **\<CardDescription\>**  
     **Ajuste o limite de mensagens por minuto (requer reinício do backend)**  
   **\</CardDescription\>**  
 **\</CardHeader\>**  
 **\<CardContent className="space-y-4"\>**  
   **\<div className="flex items-center justify-between"\>**  
     **\<Label htmlFor="cap-per-minute"\>Mensagens por minuto:\</Label\>**  
     **\<Input**  
       **id="cap-per-minute"**  
       **type="number"**  
       **min="1"**  
       **max="100"**  
       **defaultValue="30"**  
       **className="w-24"**  
       **disabled**  
     **/\>**  
   **\</div\>**  
    
   **\<Alert\>**  
     **\<Info className="h-4 w-4" /\>**  
     **\<AlertDescription\>**  
       **Atualmente: \<strong\>30 msg/min\</strong\>. Para alterar, configure**  
       **\<code className="mx-1 px-1 bg-muted rounded"\>WA\_CAP\_PER\_MINUTE\</code\>**  
       **no backend Replit.**  
     **\</AlertDescription\>**  
   **\</Alert\>**  
 **\</CardContent\>**  
**\</Card\>**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**📋 Checklist de Implementação**  
**Fase 1 \- Integração Básica**  
**\*  Adicionar endpoint /api/whatsapp/pacing ao hook de query**  
**\*  Atualizar endpoint /api/whatsapp/status para incluir pacing**  
**\*  Criar tipo TypeScript WhatsAppStatus completo**  
**\*  Testar conexão com backend**  
**Fase 2 \- Componentes Visuais**  
**\*  Atualizar badge de provider (Evolution HTTP/Local/Meta)**  
**\*  Implementar progress bar dinâmico de rate limiting**  
**\*  Adicionar seção de janela de envio com status**  
**\*  Criar indicador visual de failover**  
**Fase 3 \- Experiência do Usuário**  
**\*  Implementar notificações toast (janela fecha, limite crítico, failover)**  
**\*  Adicionar contador regressivo de reset**  
**\*  Mostrar próxima janela disponível (se fechada)**  
**\*  Alerta visual quando uso \> 80%**  
**Fase 4 \- Relatórios e Analytics**  
**\*  Criar gráfico de histórico de uso (últimos 20min)**  
**\*  Adicionar card de estatísticas diárias**  
**\*  Implementar exportação de dados (CSV)**  
**Fase 5 \- Testes e Ajustes**  
**\*  Testar com backend em modo Evolution Local**  
**\*  Testar com backend em modo Evolution HTTP**  
**\*  Testar failover (desligar Evolution HTTP)**  
**\*  Verificar responsividade mobile**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**🌐 Variáveis de Ambiente (.env)**  
**\# Backend API**  
**VITE\_API\_URL=https://seu-replit.replit.app**  
**\# Polling intervals (ms)**  
**VITE\_PACING\_POLL\_INTERVAL=5000    \# 5 segundos**  
**VITE\_STATUS\_POLL\_INTERVAL=10000   \# 10 segundos**  
**\# Features flags (opcional)**  
**VITE\_ENABLE\_PACING\_GRAPH=true**  
**VITE\_ENABLE\_FAILOVER\_INDICATOR=true**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**🎨 Cores e Ícones Sugeridos**  
**// Tema de cores para providers**  
**const PROVIDER\_COLORS \= {**  
 **evolution\_http: 'bg-blue-500',      // Cloud \- Azul**  
 **evolution\_local: 'bg-gray-500',     // Local \- Cinza**  
 **meta\_cloud: 'bg-green-500',         // Meta \- Verde**  
 **offline: 'bg-red-500'               // Offline \- Vermelho**  
**};**  
**// Ícones shadcn/ui**  
**import {**  
 **Activity,      // Rate limiting**  
 **Clock,         // Janela de envio**  
 **Shield,        // Failover**  
 **BarChart3,     // Gráficos**  
 **Info,          // Informações**  
 **AlertTriangle, // Alertas**  
 **CheckCircle2,  // Sucesso**  
 **XCircle,       // Erro**  
 **ArrowRight     // Setas de fluxo**  
**} from 'lucide-react';**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**🚀 Deploy e Go-Live**  
**1\. Desenvolvimento:**  
   **\* Implementar no ambiente de dev do Lovable**  
   **\* Testar com backend Replit em desenvolvimento**  
**2\. Staging:**  
   **\* Deploy no ambiente de staging**  
   **\* Validar com dados reais**  
**3\. Produção:**  
   **\* Habilitar feature flags gradualmente**  
   **\* Monitorar logs e métricas**  
   **\* Coletar feedback de usuários**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**📞 Suporte e Dúvidas**  
**\* Backend Issues: Verificar logs em /tmp/logs/Server\_\*.log no Replit**  
**\* Frontend Issues: Console do navegador \+ React Query DevTools**  
**\* API Errors: Endpoint /api/whatsapp/status deve retornar ok: true**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**✅ Resultado Esperado**  
**Após implementação completa, o usuário terá:**  
**1\. ✅ Visibilidade total do sistema de mensageria**  
**2\. ✅ Alertas proativos de limites e janelas**  
**3\. ✅ Transparência do sistema de failover**  
**4\. ✅ Histórico visual de uso e performance**  
**5\. ✅ UX profissional com feedback em tempo real**  
**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**

**Status: 📝 Pronto para implementação**  
**Estimativa: 8-12 horas de desenvolvimento**  
**Prioridade: Alta 🔥**  
