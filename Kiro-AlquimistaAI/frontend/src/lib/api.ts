import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/auth-store';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.alquimista.ai',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout user
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API endpoints
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  signup: (data: {
    name: string;
    email: string;
    password: string;
    company?: string;
  }) => apiClient.post('/auth/signup', data),
  
  logout: () => apiClient.post('/auth/logout'),
  
  me: () => apiClient.get('/auth/me'),
  
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
};

export const agentsAPI = {
  list: () => apiClient.get('/agents'),
  
  get: (id: string) => apiClient.get(`/agents/${id}`),
  
  toggle: (id: string, active: boolean) =>
    apiClient.patch(`/agents/${id}/toggle`, { active }),
  
  configure: (id: string, config: Record<string, any>) =>
    apiClient.put(`/agents/${id}/config`, config),
  
  metrics: (id: string) => apiClient.get(`/agents/${id}/metrics`),
};

export const dashboardAPI = {
  metrics: () => apiClient.get('/dashboard/metrics'),
  
  charts: (period: string) =>
    apiClient.get(`/dashboard/charts?period=${period}`),
};
