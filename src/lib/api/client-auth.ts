"use client";

const authRedirectReasonStorageKey = "agy-auth-redirect-reason";
const authRedirectPathStorageKey = "agy-auth-redirect-path";

export const authExpiredMessage = "Session expired. Sign in again to continue.";

const writeAuthRedirectState = (currentPath?: string) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(authRedirectReasonStorageKey, authExpiredMessage);
    if (currentPath) {
      window.sessionStorage.setItem(authRedirectPathStorageKey, currentPath);
    } else {
      window.sessionStorage.removeItem(authRedirectPathStorageKey);
    }
  } catch {
    // Ignore private mode/session storage failures.
  }
};

export const redirectToLoginForAuth = (currentPath?: string) => {
  if (typeof window === "undefined") {
    return;
  }

  writeAuthRedirectState(currentPath);
  window.location.assign("/login");
};

export const consumeAuthRedirectState = () => {
  if (typeof window === "undefined") {
    return { reason: null, nextPath: null };
  }

  try {
    const reason = window.sessionStorage.getItem(authRedirectReasonStorageKey);
    const nextPath = window.sessionStorage.getItem(authRedirectPathStorageKey);
    window.sessionStorage.removeItem(authRedirectReasonStorageKey);
    window.sessionStorage.removeItem(authRedirectPathStorageKey);
    return { reason, nextPath };
  } catch {
    return { reason: null, nextPath: null };
  }
};
