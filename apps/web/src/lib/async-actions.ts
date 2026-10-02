export async function withDeadline<T>(work: Promise<T>): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Operation timed out')),
          10000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
