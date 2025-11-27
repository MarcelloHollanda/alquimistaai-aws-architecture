'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileTab } from './profile-tab';
import { CompanyTab } from './company-tab';
import { IntegrationsTab } from './integrations-tab';

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company">
            Empresa
          </TabsTrigger>
          <TabsTrigger value="integrations">
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="company" className="mt-6">
          <CompanyTab />
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <IntegrationsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
