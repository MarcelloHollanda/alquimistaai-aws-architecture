'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { disparoAgendaApi } from '@/lib/api/disparo-agenda-api';

interface ContactsUploadProps {
  onSuccess?: () => void;
}

interface Contact {
  company: string;
  contactName: string;
  phone: string;
  email: string;
  notes?: string;
}

export function ContactsUpload({ onSuccess }: ContactsUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([
    { company: '', contactName: '', phone: '', email: '', notes: '' },
  ]);

  const addContact = () => {
    setContacts([...contacts, { company: '', contactName: '', phone: '', email: '', notes: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação básica
    const validContacts = contacts.filter(
      (c) => c.company && c.contactName && (c.phone || c.email)
    );

    if (validContacts.length === 0) {
      toast({
        title: 'Erro de validação',
        description: 'Preencha pelo menos um contato com empresa, nome e telefone/email.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);
      const result = await disparoAgendaApi.uploadContacts({ contacts: validContacts });
      
      toast({
        title: 'Sucesso',
        description: result.message,
      });

      // Limpar formulário
      setContacts([{ company: '', contactName: '', phone: '', email: '', notes: '' }]);
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar contatos',
        description: error.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // TODO: Implementar parser de CSV/Excel
    toast({
      title: 'Em desenvolvimento',
      description: 'Upload de arquivo CSV/Excel será implementado em breve.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Contatos</CardTitle>
        <CardDescription>
          Adicione contatos manualmente ou faça upload de planilha (CSV/Excel)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload de Arquivo */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <span className="text-sm font-medium text-primary hover:underline">
              Clique para fazer upload
            </span>
            <span className="text-sm text-muted-foreground"> ou arraste um arquivo</span>
          </Label>
          <Input
            id="file-upload"
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleFileUpload}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Formatos aceitos: CSV, Excel (.xlsx, .xls)
          </p>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Ou adicione manualmente</span>
          </div>
        </div>

        {/* Formulário Manual */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {contacts.map((contact, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4 relative">
              {contacts.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => removeContact(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`company-${index}`}>Empresa *</Label>
                  <Input
                    id={`company-${index}`}
                    value={contact.company}
                    onChange={(e) => updateContact(index, 'company', e.target.value)}
                    placeholder="Nome da empresa"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`contactName-${index}`}>Nome do Contato *</Label>
                  <Input
                    id={`contactName-${index}`}
                    value={contact.contactName}
                    onChange={(e) => updateContact(index, 'contactName', e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`phone-${index}`}>Telefone</Label>
                  <Input
                    id={`phone-${index}`}
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    placeholder="+55 84 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>E-mail</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`notes-${index}`}>Observações</Label>
                <Textarea
                  id={`notes-${index}`}
                  value={contact.notes}
                  onChange={(e) => updateContact(index, 'notes', e.target.value)}
                  placeholder="Informações adicionais sobre o lead..."
                  rows={2}
                />
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={addContact} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Outro Contato
            </Button>

            <Button type="submit" disabled={isUploading} className="flex-1">
              {isUploading ? 'Enviando...' : 'Enviar para o Agente'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
