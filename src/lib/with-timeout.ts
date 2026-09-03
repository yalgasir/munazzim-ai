export const LAB_PERSISTENCE_TIMEOUT_MS = 5_000;

export function withTimeout<T>(promise: Promise<T>, milliseconds = LAB_PERSISTENCE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Firestore operation timed out.')), milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}