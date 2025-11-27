import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { QueryProvider } from '@/components/providers/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AlquimistaAI - Automação Inteligente com IA',
  description: 'Plataforma de automação de vendas e marketing com 32 agentes de IA especializados',
  keywords: ['automação', 'IA', 'vendas', 'marketing', 'agentes'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <QueryProvider>
          <ErrorBoundary>
            {children}
            <Toaster />
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
