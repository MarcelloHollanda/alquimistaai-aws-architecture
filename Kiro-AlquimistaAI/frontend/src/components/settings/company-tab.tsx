'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface CompanyData {
  tenantId: string;
  name: string;
  legalName: string;
  cnpj: string;
  segment: string;
  logoUrl?: string;
  createdAt: string;
}

const SEGMENTS = [
  'E-commerce',
  'Serviços Financeiros',
  'Saúde e Bem-estar',
  'Educação',
  'Tecnologia',
  'Varejo',
  'Imobiliário',
  'Consultoria',
  'Marketing e Publicidade',
  'Indústria',
  'Outro',
];

export function CompanyTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    cnpj: '',
    segment: '',
  });

  // Verificar se usuário tem permissão para editar
  const canEdit = user?.role === 'MASTER' || user?.role === 'ADMIN';

  useEffect(() => {
    loadCompanyData();
  }, [user]);

  const loadCompanyData = async () => {
    if (!user?.tenantId) return;

    try {
      const response = await fetch(`/api/companies/${user.tenantId}`);
      if (!response.ok) throw new Error('Erro ao carregar dados da empresa');

      const data = await response.json();
      setCompany(data);
      setFormData({
        name: data.name || '',
        legalName: data.legalName || '',
        cnpj: data.cnpj || '',
        segment: data.segment || '',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados da empresa',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !user?.tenantId) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${user.tenantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Erro ao atualizar empresa');

      const updatedData = await response.json();
      setCompany(updatedData);

      toast({
        title: 'Sucesso',
        description: 'Dados da empresa atualizados com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados da empresa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.tenantId) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem válida',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 2MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', user.tenantId);

      const response = await fetch('/api/upload/logo', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Erro ao fazer upload');

      const { logoUrl } = await response.json();
      
      setCompany(prev => prev ? { ...prev, logoUrl } : null);

      toast({
        title: 'Sucesso',
        description: 'Logomarca atualizada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da logomarca',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  if (!company) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Carregando dados da empresa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informações Read-Only */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Informações da Conta</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">ID do Tenant:</span>
            <span className="ml-2 font-mono text-xs">{company.tenantId}</span>
          </div>
          <div>
            <span className="text-gray-600">Data de Criação:</span>
            <span className="ml-2">
              {new Date(company.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        </div>
      </div>

      {/* Logomarca */}
      <div>
        <Label>Logomarca</Label>
        <div className="mt-2 flex items-center space-x-4">
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt="Logo da empresa"
              className="h-16 w-16 rounded-lg object-cover border border-gray-200"
            />
          ) : (
            <div className="h-16 w-16 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <span className="text-2xl text-gray-400">🏢</span>
            </div>
          )}
          
          {canEdit && (
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG ou SVG até 2MB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Formulário de Dados */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="name">Nome fantasia *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={!canEdit || loading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="legalName">Razão social</Label>
          <Input
            id="legalName"
            value={formData.legalName}
            onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
            disabled={!canEdit || loading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="cnpj">CNPJ *</Label>
          <Input
            id="cnpj"
            value={formData.cnpj}
            onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
            disabled={!canEdit || loading}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="segment">Segmento de atuação *</Label>
          <Select
            value={formData.segment}
            onValueChange={(value) => setFormData({ ...formData, segment: value })}
            disabled={!canEdit || loading}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione o segmento" />
            </SelectTrigger>
            <SelectContent>
              {SEGMENTS.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Atenção:</strong> Apenas usuários com papel Master ou Admin podem editar os dados da empresa.
            </p>
          </div>
        )}

        {canEdit && (
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar alterações'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
