/**
 * Hook de autenticação
 * Gerencia estado global de autenticação e fornece funções wrapper para cognito-client
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as cognitoClient from '@/lib/cognito-client';
import { translateCognitoError } from '@/lib/cognito-errors';

export interface UseAuthReturn {
  user: cognitoClient.User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (params: cognitoClient.SignUpParams) => Promise<void>;
  signOut: () => void;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<cognitoClient.User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar usuário atual ao montar o componente
  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      setIsLoading(true);
      const currentUser = await cognitoClient.getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = useCallback(async () => {
    await loadCurrentUser();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cognitoClient.signIn({ email, password });
      
      // Carregar dados do usuário
      const currentUser = await cognitoClient.getCurrentUser();
      setUser(currentUser);
      
      // Redirecionar para dashboard
      router.push('/app/dashboard');
    } catch (err: any) {
      const errorMessage = translateCognitoError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const signUp = useCallback(async (params: cognitoClient.SignUpParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cognitoClient.signUp(params);
      
      // Não fazer login automático - usuário precisa confirmar e-mail
    } catch (err: any) {
      const errorMessage = translateCognitoError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    try {
      cognitoClient.signOut();
      setUser(null);
      router.push('/login');
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
    }
  }, [router]);

  const confirmSignUp = useCallback(async (email: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cognitoClient.confirmSignUp(email, code);
    } catch (err: any) {
      const errorMessage = translateCognitoError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cognitoClient.forgotPassword(email);
    } catch (err: any) {
      const errorMessage = translateCognitoError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const confirmPassword = useCallback(async (
    email: string,
    code: string,
    newPassword: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cognitoClient.confirmPassword(email, code, newPassword);
    } catch (err: any) {
      const errorMessage = translateCognitoError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const changePassword = useCallback(async (
    oldPassword: string,
    newPassword: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await cognitoClient.changePassword(oldPassword, newPassword);
    } catch (err: any) {
      const errorMessage = translateCognitoError(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signIn,
    signUp,
    signOut,
    confirmSignUp,
    forgotPassword,
    confirmPassword,
    changePassword,
    refreshUser,
    clearError,
  };
}
