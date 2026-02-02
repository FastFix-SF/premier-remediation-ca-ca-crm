import { useRef, useCallback, useState } from 'react';

/**
 * Promise-based command queue for Fasto
 * Ensures commands execute strictly in order without race conditions
 */
export function useFastoCommandQueue() {
  const queuePromiseRef = useRef<Promise<void>>(Promise.resolve());
  const [queueLength, setQueueLength] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Enqueue a command to be processed
   * Commands are chained as promises to ensure sequential execution
   */
  const enqueue = useCallback((
    executor: () => Promise<void>
  ): Promise<void> => {
    setQueueLength(prev => prev + 1);
    
    const newPromise = queuePromiseRef.current.then(async () => {
      setIsProcessing(true);
      try {
        await executor();
      } catch (error) {
        console.error('[FastoQueue] Command execution error:', error);
      } finally {
        setQueueLength(prev => Math.max(0, prev - 1));
        setIsProcessing(false);
      }
    });
    
    queuePromiseRef.current = newPromise;
    return newPromise;
  }, []);

  /**
   * Check if there are pending commands in the queue
   */
  const hasPending = queueLength > 0;

  return {
    enqueue,
    queueLength,
    isProcessing,
    hasPending,
  };
}
