'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Smartphone, 
  Monitor, 
  MapPin, 
  Clock, 
  Trash2, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Key,
  Fingerprint
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

interface SecuritySettingsProps {
  className?: string;
}

export function SecuritySettings({ className }: SecuritySettingsProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    mfaEnabled, 
    trustedDevices, 
    loginHistory,
    enableMFA,
    disableMFA,
    getTrustedDevices,
    removeTrustedDevice,
    getLoginHistory
  } = useAuthStore();
  
  const { toast } = useToast();

  useEffect(() => {
    getTrustedDevices();
    getLoginHistory();
  }, [getTrustedDevices, getLoginHistory]);

  const handleEnableMFA = async () => {
    setIsLoading(true);
    try {
      const result = await enableMFA();
      setQrCode(result.qrCode);
      setBackupCodes(result.backupCodes);
      setShowMFASetup(true);
      toast({
        title: "MFA Configurado",
        description: "Escaneie o QR Code com seu aplicativo autenticador"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Configurar MFA",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!mfaCode) {
      toast({
        title: "Código Necessário",
        description: "Digite o código MFA para desabilitar",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await disableMFA(mfaCode);
      setMfaCode('');
      toast({
        title: "MFA Desabilitado",
        description: "Autenticação de dois fatores foi desabilitada"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Desabilitar MFA",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await removeTrustedDevice(deviceId);
      toast({
        title: "Dispositivo Removido",
        description: "O dispositivo foi removido da lista de confiáveis"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Remover Dispositivo",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getSecurityScore = () => {
    let score = 0;
    if (mfaEnabled) score += 40;
    if (trustedDevices.length <= 5) score += 20;
    if (loginHistory.filter((h: any) => h.status === 'success').length > 0) score += 20;
    if (loginHistory.filter((h: any) => h.status === 'suspicious').length === 0) score += 20;
    return score;
  };

  const securityScore = getSecurityScore();

  return (
    <div className={className}>
      <div className="grid gap-6">
        {/* Security Score Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Pontuação de Segurança
            </CardTitle>
            <CardDescription>
              Avaliação geral da segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{securityScore}/100</span>
                <Badge 
                  variant={securityScore >= 80 ? 'default' : securityScore >= 50 ? 'secondary' : 'destructive'}
                >
                  {securityScore >= 80 ? 'Excelente' : securityScore >= 50 ? 'Bom' : 'Precisa Melhorar'}
                </Badge>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    securityScore >= 80 ? 'bg-green-500' : 
                    securityScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="flex items-center space-x-2">
                  {mfaEnabled ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  )}
                  <span className="text-sm">MFA {mfaEnabled ? 'Ativo' : 'Inativo'}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">{trustedDevices.length} Dispositivos</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MFA Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="h-5 w-5 mr-2" />
              Autenticação de Dois Fatores (MFA)
            </CardTitle>
            <CardDescription>
              Adicione uma camada extra de segurança à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!mfaEnabled ? (
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Recomendamos fortemente ativar a autenticação de dois fatores para proteger sua conta.
                  </AlertDescription>
                </Alert>
                
                <Button onClick={handleEnableMFA} disabled={isLoading}>
                  {isLoading ? 'Configurando...' : 'Ativar MFA'}
                </Button>

                <AnimatePresence>
                  {showMFASetup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4 mt-4"
                    >
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">1. Escaneie o QR Code</h4>
                        <div className="flex justify-center p-4 bg-white rounded">
                          <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">2. Códigos de Backup</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Guarde estes códigos em um lugar seguro. Você pode usá-los se perder acesso ao seu dispositivo.
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {backupCodes.map((code, index) => (
                            <code key={index} className="text-xs bg-white p-2 rounded">
                              {code}
                            </code>
                          ))}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={downloadBackupCodes}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar Códigos
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    MFA está ativo. Sua conta está protegida com autenticação de dois fatores.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Código MFA para Desabilitar</label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    maxLength={6}
                  />
                </div>

                <Button 
                  variant="destructive" 
                  onClick={handleDisableMFA}
                  disabled={isLoading || mfaCode.length !== 6}
                >
                  {isLoading ? 'Desabilitando...' : 'Desabilitar MFA'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trusted Devices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Dispositivos Confiáveis
            </CardTitle>
            <CardDescription>
              Gerencie os dispositivos que têm acesso à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trustedDevices.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum dispositivo confiável registrado</p>
              ) : (
                trustedDevices.map((device: any) => (
                  <div 
                    key={device.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Monitor className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{device.name}</p>
                        <p className="text-xs text-gray-500">
                          {device.browser} • {device.os}
                        </p>
                        <p className="text-xs text-gray-400">
                          Último uso: {new Date(device.lastUsed).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDevice(device.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Login History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Histórico de Login
            </CardTitle>
            <CardDescription>
              Atividades recentes de acesso à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loginHistory.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
              ) : (
                loginHistory.map((attempt: any) => (
                  <div 
                    key={attempt.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{attempt.location}</p>
                        <p className="text-xs text-gray-500">{attempt.device}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(attempt.timestamp).toLocaleString()} • IP: {attempt.ip}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={
                        attempt.status === 'success' ? 'default' : 
                        attempt.status === 'suspicious' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {attempt.status === 'success' ? 'Sucesso' : 
                       attempt.status === 'suspicious' ? 'Suspeito' : 
                       'Falhou'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
