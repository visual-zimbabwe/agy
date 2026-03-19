const canUseLocalStorage = () => typeof window !== "undefined";

export const readStorageValue = (primaryKey: string, legacyKeys: string[] = []) => {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const current = window.localStorage.getItem(primaryKey);
    if (current !== null) {
      return current;
    }

    for (const legacyKey of legacyKeys) {
      const legacyValue = window.localStorage.getItem(legacyKey);
      if (legacyValue !== null) {
        window.localStorage.setItem(primaryKey, legacyValue);
        return legacyValue;
      }
    }
  } catch {
    return null;
  }

  return null;
};

export const writeStorageValue = (key: string, value: string) => {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota/privacy mode failures.
  }
};

export const removeStorageKeys = (keys: string[]) => {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    for (const key of keys) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage cleanup failures.
  }
};
