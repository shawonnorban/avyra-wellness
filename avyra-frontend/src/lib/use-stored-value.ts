"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Fired locally because the native `storage` event only reaches other tabs. */
const CHANGE_EVENT = "avyra:storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

/**
 * Reads a localStorage key as an external store. Using useSyncExternalStore
 * instead of `useState` + `useEffect` keeps the server render and hydration in
 * agreement without a cascading re-render after mount.
 */
export function useStoredValue(key: string, serverValue: string): [string, (next: string) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => window.localStorage.getItem(key) ?? serverValue,
    () => serverValue,
  );

  const setValue = useCallback(
    (next: string) => {
      window.localStorage.setItem(key, next);
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, setValue];
}
