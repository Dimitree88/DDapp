"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type WakeLockHandle = { release: () => Promise<void>; addEventListener: (type: "release", listener: () => void, options?: { once?: boolean }) => void };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockHandle> } };
const preferenceKey = "ddapp-screen-awake";

export function ScreenAwakeToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(false);
  const sentinel = useRef<WakeLockHandle | null>(null);
  const enabledRef = useRef(false);

  const release = useCallback(() => {
    const current = sentinel.current;
    sentinel.current = null;
    if (current) void current.release().catch(() => {});
  }, []);

  const acquire = useCallback(async () => {
    if (!enabledRef.current || document.visibilityState !== "visible") return;
    const wakeLock = (navigator as WakeLockNavigator).wakeLock;
    if (!wakeLock) return;
    try {
      const next = await wakeLock.request("screen");
      if (!enabledRef.current || document.visibilityState !== "visible") {
        void next.release().catch(() => {});
        return;
      }
      release();
      sentinel.current = next;
      next.addEventListener("release", () => {
        if (sentinel.current === next) sentinel.current = null;
      }, { once: true });
      setError(false);
    } catch {
      setError(true);
    }
  }, [release]);

  useEffect(() => {
    const wakeLockSupported = window.isSecureContext && Boolean((navigator as WakeLockNavigator).wakeLock);
    setSupported(wakeLockSupported);
    if (!wakeLockSupported) return;

    const savedPreference = window.localStorage.getItem(preferenceKey) === "true";
    enabledRef.current = savedPreference;
    setEnabled(savedPreference);
    if (savedPreference) void acquire();

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
      else release();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      release();
    };
  }, [acquire, release]);

  const toggle = async () => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    setError(false);
    window.localStorage.setItem(preferenceKey, String(next));
    if (next) await acquire();
    else release();
  };

  if (!supported) return null;

  return <button type="button" onClick={() => void toggle()} aria-pressed={enabled}
    title={error ? "Il browser o il sistema non ha concesso il blocco schermo" : enabled ? "Disattiva schermo sempre acceso" : "Impedisci lo spegnimento automatico dello schermo"}
    className={`fixed bottom-3 right-3 z-40 flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-lg backdrop-blur ${enabled ? "border-accent bg-accent text-on-accent" : "border-line bg-card/95 text-ink"}`}>
    <span aria-hidden>{enabled ? "◉" : "◯"}</span>
    {enabled ? "Schermo attivo" : "Tieni acceso"}
  </button>;
}
