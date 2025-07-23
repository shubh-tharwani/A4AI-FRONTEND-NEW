import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for debouncing function calls
 */
export function useDebounce<T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T {
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * Custom hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => void>(
  callback: T,
  limit: number
): T {
  const inThrottleRef = useRef(false);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (!inThrottleRef.current) {
        callback(...args);
        inThrottleRef.current = true;
        setTimeout(() => {
          inThrottleRef.current = false;
        }, limit);
      }
    },
    [callback, limit]
  ) as T;

  return throttledCallback;
}

/**
 * Custom hook for handling async operations with cleanup
 */
export function useAsyncOperation() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((setter: () => void) => {
    if (isMountedRef.current) {
      setter();
    }
  }, []);

  return { safeSetState, isMounted: () => isMountedRef.current };
}

/**
 * Custom hook for handling window resize events with cleanup
 */
export function useWindowResize(callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const handleResize = () => {
      callbackRef.current();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
}

/**
 * Custom hook for auto-saving data with debouncing
 */
export function useAutoSave<T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  delay: number = 2000
) {
  const debouncedSave = useDebounce(saveFunction, delay);

  useEffect(() => {
    if (data) {
      debouncedSave(data);
    }
  }, [data, debouncedSave]);
}
