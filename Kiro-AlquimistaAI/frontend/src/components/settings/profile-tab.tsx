'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { changePassword } from '@/lib/cognito-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Select } from '@/components/ui/select';

export function ProfileTab() {
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    language: 'pt-BR',
    timezone: 'America/Sao_Paulo',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        language: user.language || 'pt-BR',
        timezone: user.timezone || 'America/Sao_Paulo',
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil');
      }

      setSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Senha alterada com sucesso!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordChange(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Perfil do Usuário</h3>
        <p className="text-sm text-gray-500 mt-1">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <p className="text-green-800">{success}</p>
        </Alert>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            O e-mail não pode ser alterado
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-gray-700">
            Papel
          </label>
          <Input
            id="role"
            value={user?.role || ''}
            disabled
            className="bg-gray-50"
          />
          <p className="text-xs text-gray-500">
            Seu papel na empresa
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-gray-700">
            Nome completo
          </label>
          <Input
            id="name"
            value={profileData.name}
            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Telefone
          </label>
          <Input
            id="phone"
            type="tel"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="language" className="text-sm font-medium text-gray-700">
            Idioma
          </label>
          <select
            id="language"
            value={profileData.language}
            onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="timezone" className="text-sm font-medium text-gray-700">
            Fuso horário
          </label>
          <select
            id="timezone"
            value={profileData.timezone}
            onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
            disabled={isLoading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
            <option value="America/Manaus">Manaus (GMT-4)</option>
            <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
          </select>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <div className="border-t pt-6">
        <h4 className="text-md font-medium mb-4">Segurança</h4>
        
        {!showPasswordChange ? (
          <Button
            variant="outline"
            onClick={() => setShowPasswordChange(true)}
          >
            Alterar senha
          </Button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
                Senha atual
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
                Nova senha
              </label>
              <Input
                id="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirmar nova senha
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Alterando...' : 'Alterar senha'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordChange(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                }}
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
