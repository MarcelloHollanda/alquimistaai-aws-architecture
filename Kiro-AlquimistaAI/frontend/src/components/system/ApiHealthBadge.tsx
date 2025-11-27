'use client';

import { useEffect, useState } from 'react';

type HealthStatus = 'checking' | 'ok' | 'error';

interface HealthResponse {
  ok?: boolean;
  service?: string;
  environment?: string;
  db_status?: string;
  [key: string]: any;
}

export function ApiHealthBadge() {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [details, setDetails] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production'
      ? 'https://ogsd1547nd.execute-api.us-east-1.amazonaws.com'
      : 'https://c5loeivg0k.execute-api.us-east-1.amazonaws.com');

  useEffect(() => {
    async function checkHealth() {
      try {
        setStatus('checking');
        const res = await fetch(`${baseUrl}/health`, { method: 'GET' });
        const text = await res.text();

        let json: HealthResponse | null = null;
        try {
          json = JSON.parse(text);
        } catch {
          json = { raw: text };
        }

        if (res.ok) {
          setStatus('ok');
        } else {
          setStatus('error');
        }

        setDetails(json);
        setError(null);
      } catch (e: any) {
        setStatus('error');
        setError(e?.message || 'Erro desconhecido');
      }
    }

    checkHealth();
  }, [baseUrl]);

  const color =
    status === 'ok' ? 'bg-green-600' : status === 'error' ? 'bg-red-600' : 'bg-yellow-500';

  return (
    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="font-semibold">API Health:</span>
      <span>
        {status === 'checking' && 'verificando...'}
        {status === 'ok' && 'OK'}
        {status === 'error' && 'erro'}
      </span>
      <span className="ml-2 text-[10px] text-muted-foreground">
        base: {baseUrl}
      </span>
    </div>
  );
}
