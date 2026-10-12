const STORAGE_PREFIX = 'edualerta:';

export function readStoredData<T>(
  key: string,
  initialData: T,
): T {
  try {
    const storedValue = localStorage.getItem(
      `${STORAGE_PREFIX}${key}`,
    );

    if (storedValue === null) {
      return initialData;
    }

    return JSON.parse(storedValue) as T;
  } catch (error) {
    console.error(
      `Error al leer los datos "${key}":`,
      error,
    );

    return initialData;
  }
}

export function writeStoredData<T>(
  key: string,
  data: T,
): void {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${key}`,
      JSON.stringify(data),
    );
  } catch (error) {
    console.error(
      `Error al guardar los datos "${key}":`,
      error,
    );

    throw new Error(
      'No fue posible guardar los datos localmente.',
    );
  }
}

export function removeStoredData(key: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
}