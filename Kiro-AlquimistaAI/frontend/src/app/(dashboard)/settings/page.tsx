'use client';

import { SettingsTabs } from '@/components/settings/settings-tabs';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie seu perfil, empresa e integrações
        </p>
      </div>

      <SettingsTabs />
    </div>
  );
}
