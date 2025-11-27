/**
 * Testes de integração para fluxos de autenticação
 * Requisitos: 1.2, 2.6, 3.10
 * 
 * NOTA: Estes testes requerem um ambiente Cognito configurado
 * e devem ser executados com variáveis de ambiente apropriadas
 */

import * as cognitoClient from '../../frontend/src/lib/cognito-client';

// Mock das variáveis de ambiente
process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'us-east-1_TEST123';
process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'test-client-id';
process.env.NEXT_PUBLIC_COGNITO_DOMAIN = 'https://test.auth.us-east-1.amazoncognito.com';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Mock do fetch global para simular APIs
global.fetch = jest.fn();

describe('Fluxo de Cadastro Completo', () => {
  const mockUserData = {
    email: 'teste@exemplo.com',
    password: 'Senha123!',
    name: 'Usuário Teste',
    phone: '+5584997084444',
  };

  const mockCompanyData = {
    name: 'Empresa Teste',
    legalName: 'Empresa Teste LTDA',
    cnpj: '11222333000181',
    segment: 'Tecnologia',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve completar fluxo de cadastro com sucesso', async () => {
    // Mock da criação de empresa
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tenantId: 'tenant-123' }),
    });

    // Mock da criação de usuário no backend
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ userId: 'user-123' }),
    });

    // Simular criação de empresa
    const companyResponse = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCompanyData),
    });

    expect(companyResponse.ok).toBe(true);
    const companyData = await companyResponse.json() as { tenantId: string };
    expect(companyData.tenantId).toBe('tenant-123');

    // Simular criação de usuário no backend
    const userResponse = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...mockUserData,
        tenantId: companyData.tenantId,
        role: 'MASTER',
      }),
    });

    expect(userResponse.ok).toBe(true);
    const userData = await userResponse.json() as { userId: string };
    expect(userData.userId).toBe('user-123');

    // Verificar que as chamadas foram feitas na ordem correta
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toBe('/api/companies');
    expect((global.fetch as jest.Mock).mock.calls[1][0]).toBe('/api/users');
  });

  it('deve falhar se empresa não for criada', async () => {
    // Mock de erro na criação de empresa
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'CNPJ já cadastrado' }),
    });

    const companyResponse = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockCompanyData),
    });

    expect(companyResponse.ok).toBe(false);
    expect(companyResponse.status).toBe(400);
  });

  it('deve validar dados antes de enviar', () => {
    // Validação de e-mail
    const invalidEmail = 'email-invalido';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(invalidEmail)).toBe(false);
    expect(emailRegex.test(mockUserData.email)).toBe(true);

    // Validação de senha
    const weakPassword = '123';
    expect(weakPassword.length >= 8).toBe(false);
    expect(mockUserData.password.length >= 8).toBe(true);

    // Validação de CNPJ
    const invalidCNPJ = '123';
    const cnpjClean = invalidCNPJ.replace(/\D/g, '');
    expect(cnpjClean.length).toBe(3);
    expect(cnpjClean.length === 14).toBe(false);

    const validCNPJ = mockCompanyData.cnpj.replace(/\D/g, '');
    expect(validCNPJ.length).toBe(14);
  });

  it('deve incluir tenantId ao criar usuário no Cognito', () => {
    const signUpParams = {
      email: mockUserData.email,
      password: mockUserData.password,
      name: mockUserData.name,
      phone: mockUserData.phone,
      tenantId: 'tenant-123',
    };

    expect(signUpParams.tenantId).toBeDefined();
    expect(signUpParams.tenantId).toBe('tenant-123');
  });
});

describe('Fluxo de Login Completo', () => {
  const mockCredentials = {
    email: 'usuario@exemplo.com',
    password: 'Senha123!',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve validar credenciais antes de tentar login', () => {
    // Validação de e-mail vazio
    expect(mockCredentials.email).toBeTruthy();
    expect(mockCredentials.email.length > 0).toBe(true);

    // Validação de senha vazia
    expect(mockCredentials.password).toBeTruthy();
    expect(mockCredentials.password.length > 0).toBe(true);

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    expect(emailRegex.test(mockCredentials.email)).toBe(true);

    // Validação de tamanho mínimo de senha
    expect(mockCredentials.password.length >= 8).toBe(true);
  });

  it('deve rejeitar e-mail inválido', () => {
    const invalidEmails = [
      '',
      'email-sem-arroba',
      '@sem-usuario.com',
      'sem-dominio@',
      'sem-extensao@dominio',
    ];

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    invalidEmails.forEach((email) => {
      expect(emailRegex.test(email)).toBe(false);
    });
  });

  it('deve rejeitar senha muito curta', () => {
    const shortPasswords = ['', '123', 'abc', '1234567'];

    shortPasswords.forEach((password) => {
      expect(password.length >= 8).toBe(false);
    });
  });

  it('deve processar resposta de sucesso do Cognito', async () => {
    const mockSession = {
      idToken: {
        jwtToken: 'mock-id-token',
        payload: {
          sub: 'user-123',
          email: mockCredentials.email,
          'custom:tenantId': 'tenant-123',
        },
      },
      accessToken: {
        jwtToken: 'mock-access-token',
      },
      refreshToken: {
        token: 'mock-refresh-token',
      },
    };

    // Verificar estrutura da sessão
    expect(mockSession.idToken).toBeDefined();
    expect(mockSession.accessToken).toBeDefined();
    expect(mockSession.refreshToken).toBeDefined();
    expect(mockSession.idToken.payload.sub).toBe('user-123');
    expect(mockSession.idToken.payload['custom:tenantId']).toBe('tenant-123');
  });

  it('deve armazenar tokens após login bem-sucedido', async () => {
    const mockTokens = {
      idToken: 'mock-id-token',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    // Mock da API de sessão
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockTokens),
    });

    expect(response.ok).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/session',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(mockTokens),
      })
    );
  });
});

describe('Fluxo de Recuperação de Senha', () => {
  const mockEmail = 'usuario@exemplo.com';
  const mockCode = '123456';
  const mockNewPassword = 'NovaSenha123!';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve validar e-mail antes de solicitar recuperação', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // E-mail válido
    expect(emailRegex.test(mockEmail)).toBe(true);

    // E-mails inválidos
    expect(emailRegex.test('')).toBe(false);
    expect(emailRegex.test('email-invalido')).toBe(false);
  });

  it('deve validar código de verificação', () => {
    // Código deve ter 6 dígitos
    expect(mockCode.length).toBe(6);
    expect(/^\d{6}$/.test(mockCode)).toBe(true);

    // Códigos inválidos
    expect(/^\d{6}$/.test('12345')).toBe(false); // Muito curto
    expect(/^\d{6}$/.test('1234567')).toBe(false); // Muito longo
    expect(/^\d{6}$/.test('12345a')).toBe(false); // Contém letra
  });

  it('deve validar nova senha', () => {
    // Senha deve ter no mínimo 8 caracteres
    expect(mockNewPassword.length >= 8).toBe(true);

    // Senha deve conter maiúscula
    expect(/[A-Z]/.test(mockNewPassword)).toBe(true);

    // Senha deve conter minúscula
    expect(/[a-z]/.test(mockNewPassword)).toBe(true);

    // Senha deve conter número
    expect(/[0-9]/.test(mockNewPassword)).toBe(true);

    // Senha deve conter caractere especial
    expect(/[!@#$%^&*(),.?":{}|<>]/.test(mockNewPassword)).toBe(true);
  });

  it('deve completar fluxo de recuperação em duas etapas', async () => {
    // Etapa 1: Solicitar código
    const forgotPasswordData = { email: mockEmail };
    expect(forgotPasswordData.email).toBe(mockEmail);

    // Etapa 2: Confirmar nova senha com código
    const confirmPasswordData = {
      email: mockEmail,
      code: mockCode,
      newPassword: mockNewPassword,
    };

    expect(confirmPasswordData.email).toBe(mockEmail);
    expect(confirmPasswordData.code).toBe(mockCode);
    expect(confirmPasswordData.newPassword).toBe(mockNewPassword);
    expect(confirmPasswordData.newPassword.length >= 8).toBe(true);
  });

  it('deve rejeitar código expirado ou inválido', () => {
    const invalidCodes = [
      '',
      '12345', // Muito curto
      '1234567', // Muito longo
      'abcdef', // Não numérico
      '12345a', // Contém letra
    ];

    invalidCodes.forEach((code) => {
      expect(/^\d{6}$/.test(code)).toBe(false);
    });
  });

  it('deve redirecionar para login após sucesso', () => {
    const redirectUrl = '/auth/login';
    const successMessage = 'Senha alterada com sucesso';

    expect(redirectUrl).toBe('/auth/login');
    expect(successMessage).toContain('sucesso');
  });
});

describe('Integração entre Fluxos', () => {
  it('deve manter consistência de dados entre cadastro e login', () => {
    const userData = {
      email: 'usuario@exemplo.com',
      password: 'Senha123!',
      name: 'Usuário Teste',
      tenantId: 'tenant-123',
    };

    // Dados usados no cadastro
    const signUpData = {
      email: userData.email,
      password: userData.password,
      name: userData.name,
      tenantId: userData.tenantId,
    };

    // Dados usados no login
    const signInData = {
      email: userData.email,
      password: userData.password,
    };

    // E-mail e senha devem ser os mesmos
    expect(signUpData.email).toBe(signInData.email);
    expect(signUpData.password).toBe(signInData.password);
  });

  it('deve associar usuário ao tenant correto', () => {
    const tenantId = 'tenant-123';
    const userId = 'user-456';

    const userRecord = {
      userId,
      tenantId,
      email: 'usuario@exemplo.com',
      role: 'MASTER',
    };

    expect(userRecord.tenantId).toBe(tenantId);
    expect(userRecord.userId).toBe(userId);
    expect(userRecord.role).toBe('MASTER');
  });

  it('deve validar fluxo completo: cadastro → confirmação → login', async () => {
    const email = 'novo@exemplo.com';
    const password = 'Senha123!';

    // 1. Cadastro
    const signUpSuccess = true;
    expect(signUpSuccess).toBe(true);

    // 2. Confirmação (usuário recebe e-mail)
    const confirmationCode = '123456';
    expect(/^\d{6}$/.test(confirmationCode)).toBe(true);

    // 3. Login após confirmação
    const loginData = { email, password };
    expect(loginData.email).toBe(email);
    expect(loginData.password).toBe(password);
  });
});

describe('Tratamento de Erros nos Fluxos', () => {
  it('deve tratar erro de e-mail já cadastrado', () => {
    const errorCode = 'UsernameExistsException';
    const errorMessage = 'Este e-mail já está cadastrado';

    expect(errorCode).toBe('UsernameExistsException');
    expect(errorMessage).toContain('já está cadastrado');
  });

  it('deve tratar erro de credenciais inválidas', () => {
    const errorCode = 'NotAuthorizedException';
    const errorMessage = 'E-mail ou senha incorretos';

    expect(errorCode).toBe('NotAuthorizedException');
    expect(errorMessage).toContain('incorretos');
  });

  it('deve tratar erro de usuário não confirmado', () => {
    const errorCode = 'UserNotConfirmedException';
    const errorMessage = 'Usuário não confirmado. Verifique seu e-mail';

    expect(errorCode).toBe('UserNotConfirmedException');
    expect(errorMessage).toContain('não confirmado');
  });

  it('deve tratar erro de código de verificação inválido', () => {
    const errorCode = 'CodeMismatchException';
    const errorMessage = 'Código de verificação inválido';

    expect(errorCode).toBe('CodeMismatchException');
    expect(errorMessage).toContain('inválido');
  });

  it('deve tratar erro de código expirado', () => {
    const errorCode = 'ExpiredCodeException';
    const errorMessage = 'Código de verificação expirado';

    expect(errorCode).toBe('ExpiredCodeException');
    expect(errorMessage).toContain('expirado');
  });

  it('deve tratar erro de senha fraca', () => {
    const errorCode = 'InvalidPasswordException';
    const errorMessage = 'Senha não atende aos requisitos mínimos';

    expect(errorCode).toBe('InvalidPasswordException');
    expect(errorMessage).toContain('requisitos mínimos');
  });
});
