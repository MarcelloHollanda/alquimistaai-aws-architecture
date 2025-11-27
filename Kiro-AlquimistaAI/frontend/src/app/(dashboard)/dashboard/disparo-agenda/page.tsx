import { DisparoAgendaShell } from '@/components/disparo-agenda/DisparoAgendaShell';

/**
 * Página Disparo & Agendamento
 * 
 * Versão simplificada usando apenas o shell mínimo.
 * Sem lógica de auth, hooks complexos ou chamadas de API.
 * 
 * Após validar que a rota está saudável, o conteúdo completo
 * (tabs, formulários, etc.) será reintroduzido gradualmente.
 */
export default function DisparoAgendaPage() {
  return <DisparoAgendaShell />;
}
