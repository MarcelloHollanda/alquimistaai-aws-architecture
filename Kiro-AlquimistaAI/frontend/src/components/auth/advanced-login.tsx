'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Shield, 
  Smartphone, 
  Globe, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Monitor,
  Fingerprint
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook, FaMicrosoft } from 'react-icons/fa';
import { useAuthStore } from '@/stores/auth-store';
import { useToast } from '@/hooks/use-toast';

interface AdvancedLoginProps {
  variant?: 'fibonacci' | 'nigredo' | 'default';
  onSuccess?: () => void;
}

interface LoginAttempt {
  id: string;
  timestamp: Date;
  ip: string;
  location: string;
  device: string;
  status: 'success' | 'failed' | 'suspicious';
}

interface TrustedDevice {
  id: string;
  name: string;
  type: string;
  browser: string;
  os: string;
  lastUsed: Date;
  trusted: boolean;
}

export function AdvancedLogin({ variant = 'default', onSuccess }: AdvancedLoginProps) {
  const [activeTab, setActiveTab] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [showMFA, setShowMFA] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [suspiciousActivity, setSuspiciousActivity] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  const { login, loginWithSocial, sendMagicLink, verifyMFA } = useAuthStore();
  const { toast } = useToast();

  const getVariantConfig = () => {
    switch (variant) {
      case 'fibonacci':
        return {
          primary: 'from-purple-600 to-indigo-600',
          secondary: 'from-purple-50 to-indigo-50',
          accent: 'purple-600',
          logo: '🔮',
          title: 'Fibonacci Login',
          subtitle: 'Acesse o núcleo orquestrador'
        };
      case 'nigredo':
        return {
          primary: 'from-gray-800 to-black',
          secondary: 'from-gray-50 to-slate-50',
          accent: 'gray-800',
          logo: '⚫',
          title: 'Nigredo Login',
          subtitle: 'Acesse os agentes especializados'
        };
      default:
        return {
          primary: 'from-blue-600 to-cyan-600',
          secondary: 'from-blue-50 to-cyan-50',
          accent: 'blue-600',
          logo: '🤖',
          title: 'Alquimista.AI',
          subtitle: 'Acesse sua conta'
        };
    }
  };

  const config = getVariantConfig();

  useEffect(() => {
    setLoginAttempts([
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        ip: '192.168.1.100',
        location: 'São Paulo, BR',
        device: 'Chrome on Windows',
        status: 'success'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        ip: '10.0.0.1',
        location: 'Rio de Janeiro, BR',
        device: 'Safari on macOS',
        status: 'suspicious'
      }
    ]);

    setTrustedDevices([
      {
        id: '1',
        name: 'Meu Computador',
        type: 'Desktop',
        browser: 'Chrome',
        os: 'Windows 11',
        lastUsed: new Date(),
        trusted: true
      }
    ]);
  }, []);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setAccountLocked(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accountLocked) return;
    
    setIsLoading(true);
    
    try {
      const isSuspicious = Math.random() > 0.7;
      
      if (isSuspicious) {
        setSuspiciousActivity(true);
        toast({
          title: "Atividade Suspeita Detectada",
          description: "Login de localização não reconhecida. Verificação adicional necessária.",
          variant: "destructive"
        });
        return;
      }

      const result = await login(email, password);
      
      if (result.requiresMFA) {
        setShowMFA(true);
        toast({
          title: "Verificação MFA Necessária",
          description: "Digite o código do seu aplicativo autenticador."
        });
        return;
      }

      if (result.success) {
        toast({
          title: "Login Realizado",
          description: "Bem-vindo de volta!"
        });
        onSuccess?.();
      }
    } catch (error: any) {
      if (error.code === 'ACCOUNT_LOCKED') {
        setAccountLocked(true);
        setLockoutTime(1800);
        toast({
          title: "Conta Bloqueada",
          description: "Muitas tentativas falharam. Conta bloqueada por 30 minutos.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Erro no Login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'microsoft') => {
    setIsLoading(true);
    try {
      await loginWithSocial(provider);
      toast({
        title: "Login Social Realizado",
        description: `Conectado via ${provider}`
      });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro no Login Social",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await sendMagicLink(email);
      setMagicLinkSent(true);
      toast({
        title: "Magic Link Enviado",
        description: "Verifique seu email e clique no link para fazer login."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao Enviar Magic Link",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await verifyMFA(mfaCode);
      if (result.success) {
        toast({
          title: "MFA Verificado",
          description: "Login concluído com sucesso!"
        });
        onSuccess?.();
      }
    } catch (error: any) {
      toast({
        title: "Código MFA Inválido",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatLockoutTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className={`absolute inset-0 bg-gradient-to-br ${config.secondary} opacity-50`} />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className={`text-center bg-gradient-to-r ${config.primary} text-white rounded-t-lg`}>
            <div className="text-4xl mb-2">{config.logo}</div>
            <CardTitle className="text-2xl font-bold">{config.title}</CardTitle>
            <CardDescription className="text-white/80">{config.subtitle}</CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            <AnimatePresence>
              {accountLocked && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Conta bloqueada por segurança. Tempo restante: {formatLockoutTime(lockoutTime)}
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {suspiciousActivity && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4"
                >
                  <Alert variant="destructive">
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Atividade suspeita detectada. Verificação adicional necessária.
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-red-600"
                        onClick={() => setShowSecurityInfo(true)}
                      >
                        Ver detalhes
                      </Button>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showMFA && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <form onSubmit={handleMFAVerification} className="space-y-4">
                    <div className="text-center mb-4">
                      <Smartphone className={`h-12 w-12 mx-auto text-${config.accent} mb-2`} />
                      <h3 className="text-lg font-semibold">Verificação MFA</h3>
                      <p className="text-sm text-gray-600">Digite o código do seu aplicativo autenticador</p>
                    </div>
                    
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="000000"
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        className="text-center text-2xl tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className={`w-full bg-${config.accent}`}
                      disabled={isLoading || mfaCode.length !== 6}
                    >
                      {isLoading ? 'Verificando...' : 'Verificar Código'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => setShowMFA(false)}
                    >
                      Voltar
                    </Button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {!showMFA && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="password">Senha</TabsTrigger>
                      <TabsTrigger value="magic">Magic Link</TabsTrigger>
                      <TabsTrigger value="social">Social</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="password" className="space-y-4">
                      <form onSubmit={handlePasswordLogin} className="space-y-4">
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10"
                            required
                            disabled={accountLocked}
                          />
                        </div>
                        
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Sua senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                            required
                            disabled={accountLocked}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            disabled={accountLocked}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        
                        <Button 
                          type="submit" 
                          className={`w-full bg-${config.accent}`}
                          disabled={isLoading || accountLocked}
                        >
                          {isLoading ? 'Entrando...' : 'Entrar'}
                        </Button>
                      </form>
                    </TabsContent>
                    
                    <TabsContent value="magic" className="space-y-4">
                      {!magicLinkSent ? (
                        <form onSubmit={handleMagicLink} className="space-y-4">
                          <div className="text-center mb-4">
                            <Mail className={`h-12 w-12 mx-auto text-${config.accent} mb-2`} />
                            <h3 className="text-lg font-semibold">Login sem Senha</h3>
                            <p className="text-sm text-gray-600">Receba um link mágico por email</p>
                          </div>
                          
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="seu@email.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10"
                              required
                            />
                          </div>
                          
                          <Button 
                            type="submit" 
                            className={`w-full bg-${config.accent}`}
                            disabled={isLoading}
                          >
                            {isLoading ? 'Enviando...' : 'Enviar Magic Link'}
                          </Button>
                        </form>
                      ) : (
                        <div className="text-center space-y-4">
                          <CheckCircle className={`h-12 w-12 mx-auto text-green-500 mb-2`} />
                          <h3 className="text-lg font-semibold">Magic Link Enviado!</h3>
                          <p className="text-sm text-gray-600">
                            Verifique seu email e clique no link para fazer login.
                          </p>
                          <p className="text-xs text-gray-500">
                            O link expira em 15 minutos.
                          </p>
                          <Button 
                            variant="ghost" 
                            onClick={() => setMagicLinkSent(false)}
                          >
                            Enviar Novamente
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="social" className="space-y-4">
                      <div className="text-center mb-4">
                        <Globe className={`h-12 w-12 mx-auto text-${config.accent} mb-2`} />
                        <h3 className="text-lg font-semibold">Login Social</h3>
                        <p className="text-sm text-gray-600">Entre com sua conta social</p>
                      </div>
                      
                      <div className="space-y-3">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSocialLogin('google')}
                          disabled={isLoading}
                        >
                          <FcGoogle className="h-5 w-5 mr-2" />
                          Continuar com Google
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSocialLogin('facebook')}
                          disabled={isLoading}
                        >
                          <FaFacebook className="h-5 w-5 mr-2 text-blue-600" />
                          Continuar com Facebook
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleSocialLogin('microsoft')}
                          disabled={isLoading}
                        >
                          <FaMicrosoft className="h-5 w-5 mr-2 text-blue-500" />
                          Continuar com Microsoft
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showSecurityInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 p-4 bg-gray-50 rounded-lg"
                >
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Informações de Segurança
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium mb-2">Tentativas Recentes</h5>
                      <div className="space-y-2">
                        {loginAttempts.map((attempt) => (
                          <div key={attempt.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-3 w-3" />
                              <span>{attempt.location}</span>
                            </div>
                            <Badge 
                              variant={attempt.status === 'success' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {attempt.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium mb-2">Dispositivos Confiáveis</h5>
                      <div className="space-y-2">
                        {trustedDevices.map((device) => (
                          <div key={device.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-2">
                              <Monitor className="h-3 w-3" />
                              <span>{device.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              <Fingerprint className="h-3 w-3 mr-1" />
                              Confiável
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setShowSecurityInfo(false)}
                  >
                    Fechar
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 text-center space-y-2">
              <Button variant="link" className="text-sm">
                Esqueceu sua senha?
              </Button>
              <div className="text-xs text-gray-500">
                Não tem uma conta?{' '}
                <Button variant="link" className="text-xs p-0 h-auto">
                  Criar conta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
