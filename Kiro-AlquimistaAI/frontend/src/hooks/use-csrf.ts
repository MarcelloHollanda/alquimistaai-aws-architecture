import { useEffect, useState } from 'react';
import { generateCSRFToken, storeCSRFToken, getCSRFToken } from '@/utils/security';

/**
 * Hook to manage CSRF tokens
 */
export function useCSRF() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if token exists
    let existingToken = getCSRFToken();

    if (!existingToken) {
      // Generate new token
      existingToken = generateCSRFToken();
      storeCSRFToken(existingToken);
    }

    setToken(existingToken);
  }, []);

  const refreshToken = () => {
    const newToken = generateCSRFToken();
    storeCSRFToken(newToken);
    setToken(newToken);
    return newToken;
  };

  return { token, refreshToken };
}
