import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryCondition?: (error: any) => boolean;
}

const defaultConfig: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
  retryCondition: (error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    return !error.response || 
           error.code === 'ECONNABORTED' || 
           (error.response?.status >= 500 && error.response?.status < 600);
  }
};

export function useRetryableOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const finalConfig = { ...defaultConfig, ...config };

  const executeWithRetry = useCallback(
    async (...args: T): Promise<R> => {
      setIsLoading(true);
      setError(null);
      setAttemptCount(0);

      let lastError: Error;
      let delay = finalConfig.delayMs;

      for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
        try {
          setAttemptCount(attempt);
          
          if (attempt > 1) {
            console.log(`🔄 Retry attempt ${attempt}/${finalConfig.maxAttempts}`);
            toast(`Retry attempt ${attempt}/${finalConfig.maxAttempts}...`, {
              icon: '🔄',
              duration: 2000,
            });
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= finalConfig.backoffMultiplier;
          }

          const result = await operation(...args);
          setIsLoading(false);
          
          if (attempt > 1) {
            toast.success('Operation succeeded after retry!');
          }
          
          return result;
        } catch (err: any) {
          lastError = err;
          console.error(`❌ Attempt ${attempt} failed:`, err);

          // Check if we should retry
          if (attempt < finalConfig.maxAttempts && finalConfig.retryCondition?.(err)) {
            continue;
          } else {
            // Final failure
            setError(lastError);
            setIsLoading(false);
            
            if (attempt >= finalConfig.maxAttempts) {
              toast.error(`Operation failed after ${finalConfig.maxAttempts} attempts. Please try again later.`);
            }
            
            throw lastError;
          }
        }
      }

      // This should never be reached, but TypeScript needs it
      throw lastError!;
    },
    [operation, finalConfig]
  );

  const reset = useCallback(() => {
    setError(null);
    setAttemptCount(0);
    setIsLoading(false);
  }, []);

  return {
    execute: executeWithRetry,
    isLoading,
    error,
    attemptCount,
    reset
  };
}

/**
 * Higher-order function to wrap any async function with retry logic
 */
export function withRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: Partial<RetryConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (...args: T): Promise<R> => {
    let lastError: Error;
    let delay = finalConfig.delayMs;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        if (attempt > 1) {
          console.log(`🔄 Retry attempt ${attempt}/${finalConfig.maxAttempts}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= finalConfig.backoffMultiplier;
        }

        return await fn(...args);
      } catch (err: any) {
        lastError = err;
        
        if (attempt < finalConfig.maxAttempts && finalConfig.retryCondition?.(err)) {
          continue;
        } else {
          throw lastError;
        }
      }
    }

    throw lastError!;
  };
}

/**
 * Circuit breaker pattern for preventing cascade failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly timeoutMs: number = 60000, // 1 minute
    private readonly retryTimeoutMs: number = 10000 // 10 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.retryTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }

    try {
      const result = await Promise.race([
        operation(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Operation timeout')), this.timeoutMs)
        )
      ]);

      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn('🚨 Circuit breaker OPEN - too many failures');
      toast.error('Service temporarily unavailable. Please try again later.');
    }
  }

  private reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    console.log('✅ Circuit breaker CLOSED - service restored');
  }

  getState(): string {
    return this.state;
  }
}

// Global circuit breaker instances
export const apiCircuitBreaker = new CircuitBreaker(3, 30000, 5000);
export const authCircuitBreaker = new CircuitBreaker(2, 10000, 3000);
