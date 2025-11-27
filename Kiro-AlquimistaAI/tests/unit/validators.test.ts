/**
 * Testes unitários para funções de validação
 * Requisitos: 10.1, 10.2, 10.3, 10.4
 */

import {
  validateEmail,
  validatePassword,
  validateCNPJ,
  validatePhone,
  formatCNPJ,
  formatPhone,
} from '../../frontend/src/lib/validators';

describe('validateEmail', () => {
  describe('casos válidos', () => {
    it('deve validar e-mail simples', () => {
      const result = validateEmail('usuario@exemplo.com');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('deve validar e-mail com subdomínio', () => {
      const result = validateEmail('usuario@mail.exemplo.com');
      expect(result.valid).toBe(true);
    });

    it('deve validar e-mail com números', () => {
      const result = validateEmail('usuario123@exemplo.com');
      expect(result.valid).toBe(true);
    });

    it('deve validar e-mail com caracteres especiais permitidos', () => {
      const result = validateEmail('usuario.nome+tag@exemplo.com');
      expect(result.valid).toBe(true);
    });

    it('deve validar e-mail com domínio de dois caracteres', () => {
      const result = validateEmail('usuario@exemplo.co');
      expect(result.valid).toBe(true);
    });
  });

  describe('casos inválidos', () => {
    it('deve rejeitar e-mail vazio', () => {
      const result = validateEmail('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('E-mail é obrigatório');
    });

    it('deve rejeitar e-mail sem @', () => {
      const result = validateEmail('usuarioexemplo.com');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Formato de e-mail inválido');
    });

    it('deve rejeitar e-mail sem domínio', () => {
      const result = validateEmail('usuario@');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Formato de e-mail inválido');
    });

    it('deve rejeitar e-mail sem nome de usuário', () => {
      const result = validateEmail('@exemplo.com');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Formato de e-mail inválido');
    });

    it('deve rejeitar e-mail sem extensão', () => {
      const result = validateEmail('usuario@exemplo');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Formato de e-mail inválido');
    });

    it('deve rejeitar e-mail com espaços', () => {
      const result = validateEmail('usuario @exemplo.com');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Formato de e-mail inválido');
    });

    it('deve rejeitar e-mail com múltiplos @', () => {
      const result = validateEmail('usuario@@exemplo.com');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Formato de e-mail inválido');
    });
  });
});

describe('validatePassword', () => {
  describe('casos válidos', () => {
    it('deve validar senha com todos os requisitos', () => {
      const result = validatePassword('Senha123!');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('deve validar senha com 8 caracteres exatos', () => {
      const result = validatePassword('Abc123!@');
      expect(result.valid).toBe(true);
    });

    it('deve validar senha longa', () => {
      const result = validatePassword('SenhaForte123!@#$%');
      expect(result.valid).toBe(true);
    });

    it('deve validar senha com diferentes caracteres especiais', () => {
      const passwords = [
        'Senha123!',
        'Senha123@',
        'Senha123#',
        'Senha123$',
        'Senha123%',
        'Senha123^',
        'Senha123&',
        'Senha123*',
      ];

      passwords.forEach((password) => {
        const result = validatePassword(password);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('casos inválidos', () => {
    it('deve rejeitar senha vazia', () => {
      const result = validatePassword('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Senha é obrigatória');
    });

    it('deve rejeitar senha com menos de 8 caracteres', () => {
      const result = validatePassword('Abc12!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Senha deve ter no mínimo 8 caracteres');
    });

    it('deve rejeitar senha sem letra maiúscula', () => {
      const result = validatePassword('senha123!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Senha deve conter pelo menos uma letra maiúscula');
    });

    it('deve rejeitar senha sem letra minúscula', () => {
      const result = validatePassword('SENHA123!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Senha deve conter pelo menos uma letra minúscula');
    });

    it('deve rejeitar senha sem número', () => {
      const result = validatePassword('SenhaForte!');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Senha deve conter pelo menos um número');
    });

    it('deve rejeitar senha sem caractere especial', () => {
      const result = validatePassword('Senha123');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Senha deve conter pelo menos um caractere especial (!@#$%^&*...)');
    });

    it('deve rejeitar senha com apenas letras', () => {
      const result = validatePassword('SenhaForte');
      expect(result.valid).toBe(false);
    });

    it('deve rejeitar senha com apenas números', () => {
      const result = validatePassword('12345678');
      expect(result.valid).toBe(false);
    });
  });
});

describe('validateCNPJ', () => {
  describe('casos válidos', () => {
    it('deve validar CNPJ formatado válido', () => {
      const result = validateCNPJ('11.222.333/0001-81');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('deve validar CNPJ sem formatação válido', () => {
      const result = validateCNPJ('11222333000181');
      expect(result.valid).toBe(true);
    });

    it('deve validar outro CNPJ válido', () => {
      const result = validateCNPJ('06.990.590/0001-23');
      expect(result.valid).toBe(true);
    });

    it('deve validar CNPJ com pontuação parcial', () => {
      const result = validateCNPJ('11222333/0001-81');
      expect(result.valid).toBe(true);
    });
  });

  describe('casos inválidos', () => {
    it('deve rejeitar CNPJ vazio', () => {
      const result = validateCNPJ('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('CNPJ é obrigatório');
    });

    it('deve rejeitar CNPJ com menos de 14 dígitos', () => {
      const result = validateCNPJ('1122233300018');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('CNPJ deve ter 14 dígitos');
    });

    it('deve rejeitar CNPJ com mais de 14 dígitos', () => {
      const result = validateCNPJ('112223330001811');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('CNPJ deve ter 14 dígitos');
    });

    it('deve rejeitar CNPJ com todos os dígitos iguais', () => {
      const cnpjs = [
        '00000000000000',
        '11111111111111',
        '22222222222222',
        '33333333333333',
      ];

      cnpjs.forEach((cnpj) => {
        const result = validateCNPJ(cnpj);
        expect(result.valid).toBe(false);
        expect(result.message).toBe('CNPJ inválido');
      });
    });

    it('deve rejeitar CNPJ com dígito verificador inválido', () => {
      const result = validateCNPJ('11.222.333/0001-82');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('CNPJ inválido');
    });

    it('deve rejeitar CNPJ com primeiro dígito verificador inválido', () => {
      const result = validateCNPJ('11.222.333/0001-91');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('CNPJ inválido');
    });

    it('deve rejeitar CNPJ com letras', () => {
      const result = validateCNPJ('11.222.333/000A-81');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('CNPJ deve ter 14 dígitos');
    });
  });
});

describe('validatePhone', () => {
  describe('casos válidos', () => {
    it('deve validar telefone celular formatado (11 dígitos)', () => {
      const result = validatePhone('(84) 99708-4444');
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });

    it('deve validar telefone fixo formatado (10 dígitos)', () => {
      const result = validatePhone('(84) 3234-5678');
      expect(result.valid).toBe(true);
    });

    it('deve validar telefone celular sem formatação', () => {
      const result = validatePhone('84997084444');
      expect(result.valid).toBe(true);
    });

    it('deve validar telefone fixo sem formatação', () => {
      const result = validatePhone('8432345678');
      expect(result.valid).toBe(true);
    });

    it('deve validar telefone com formatação parcial', () => {
      const result = validatePhone('84 997084444');
      expect(result.valid).toBe(true);
    });

    it('deve validar diferentes DDDs válidos', () => {
      const phones = [
        '(11) 99999-9999',
        '(21) 98888-8888',
        '(84) 97777-7777',
        '(85) 96666-6666',
      ];

      phones.forEach((phone) => {
        const result = validatePhone(phone);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('casos inválidos', () => {
    it('deve rejeitar telefone vazio', () => {
      const result = validatePhone('');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Telefone é obrigatório');
    });

    it('deve rejeitar telefone com menos de 10 dígitos', () => {
      const result = validatePhone('849970844');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Telefone deve ter 10 ou 11 dígitos');
    });

    it('deve rejeitar telefone com mais de 11 dígitos', () => {
      const result = validatePhone('849970844445');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('Telefone deve ter 10 ou 11 dígitos');
    });

    it('deve rejeitar telefone com DDD inválido (menor que 11)', () => {
      const result = validatePhone('(10) 99708-4444');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('DDD inválido');
    });

    it('deve rejeitar telefone com DDD 00', () => {
      const result = validatePhone('(00) 99708-4444');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('DDD inválido');
    });

    it('deve aceitar telefone com letras (remove caracteres não numéricos)', () => {
      // A função remove caracteres não numéricos, então '(84) 9970A-4444' vira '84997044444'
      const result = validatePhone('(84) 9970A-4444');
      expect(result.valid).toBe(true);
    });
  });
});

describe('formatCNPJ', () => {
  it('deve formatar CNPJ sem pontuação', () => {
    const formatted = formatCNPJ('11222333000181');
    expect(formatted).toBe('11.222.333/0001-81');
  });

  it('deve reformatar CNPJ já formatado', () => {
    const formatted = formatCNPJ('11.222.333/0001-81');
    expect(formatted).toBe('11.222.333/0001-81');
  });

  it('deve formatar CNPJ com pontuação parcial', () => {
    const formatted = formatCNPJ('11222333/000181');
    expect(formatted).toBe('11.222.333/0001-81');
  });
});

describe('formatPhone', () => {
  it('deve formatar telefone celular (11 dígitos)', () => {
    const formatted = formatPhone('84997084444');
    expect(formatted).toBe('(84) 99708-4444');
  });

  it('deve formatar telefone fixo (10 dígitos)', () => {
    const formatted = formatPhone('8432345678');
    expect(formatted).toBe('(84) 3234-5678');
  });

  it('deve manter telefone já formatado', () => {
    const formatted = formatPhone('(84) 99708-4444');
    expect(formatted).toBe('(84) 99708-4444');
  });

  it('deve retornar telefone inválido sem alteração', () => {
    const formatted = formatPhone('123');
    expect(formatted).toBe('123');
  });

  it('deve reformatar telefone com pontuação parcial', () => {
    const formatted = formatPhone('84 997084444');
    expect(formatted).toBe('(84) 99708-4444');
  });
});
