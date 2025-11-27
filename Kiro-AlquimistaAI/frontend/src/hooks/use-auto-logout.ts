import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseAutoLogoutOptions {
  timeout?: number; // in milliseconds
  onWarning?: (remainingTime: number) => void;
  onLogout?: () => void;
  warningTime?: number; // show warning X ms before logout
}

/**
 * Hook to automatically logout user after inactivity
 * Default: 30 minutes of inactivity
 */
export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    timeout = 30 * 60 * 1000, // 30 minutes
    onWarning,
    onLogout,
    warningTime = 2 * 60 * 1000, // 2 minutes before logout
  } = options;

  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    clearTimers();
    
    // Clear auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.clear();
    }

    // Call custom logout handler
    if (onLogout) {
      onLogout();
    }

    // Redirect to login
    router.push('/login?reason=inactivity');
  }, [clearTimers, onLogout, router]);

  const handleWarning = useCallback(() => {
    const remainingTime = warningTime;
    if (onWarning) {
      onWarning(remainingTime);
    }
  }, [onWarning, warningTime]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    clearTimers();

    // Set warning timer
    warningRef.current = setTimeout(() => {
      handleWarning();
    }, timeout - warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      handleLogout();
    }, timeout);
  }, [timeout, warningTime, clearTimers, handleWarning, handleLogout]);

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    // Throttle activity detection to avoid too many resets
    let throttleTimeout: NodeJS.Timeout | null = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          resetTimer();
          throttleTimeout = null;
        }, 1000); // Throttle to once per second
      }
    };

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Initial timer setup
    resetTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimers();
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [resetTimer, clearTimers]);

  return {
    resetTimer,
    getLastActivity: () => lastActivityRef.current,
    getRemainingTime: () => {
      const elapsed = Date.now() - lastActivityRef.current;
      return Math.max(0, timeout - elapsed);
    },
  };
}
