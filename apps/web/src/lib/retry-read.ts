export async function retryRead<T>(
  read: (signal: AbortSignal) => Promise<T>,
  signal: AbortSignal,
  retryable: (error: unknown) => boolean,
  { timeoutMs = 90000, delayMs = 3000 } = {},
): Promise<T> {
  const activeSignal = AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]);
  while (true) {
    activeSignal.throwIfAborted();
    try {
      return await read(activeSignal);
    } catch (error) {
      activeSignal.throwIfAborted();
      if (!retryable(error)) throw error;
    }
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(done, delayMs);
      function done() {
        activeSignal.removeEventListener('abort', abort);
        resolve();
      }
      function abort() {
        clearTimeout(timer);
        reject(activeSignal.reason);
      }
      activeSignal.addEventListener('abort', abort, { once: true });
      if (activeSignal.aborted) abort();
    });
  }
}
