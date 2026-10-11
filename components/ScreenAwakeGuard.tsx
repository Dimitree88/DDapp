"use client";

import { useEffect } from "react";

type WakeLockHandle = { release: () => Promise<void>; addEventListener: (type: "release", listener: () => void, options?: { once?: boolean }) => void };
type WakeLockNavigator = Navigator & { wakeLock?: { request: (type: "screen") => Promise<WakeLockHandle> } };

export function ScreenAwakeGuard() {
  useEffect(() => {
    const wakeLock = (navigator as WakeLockNavigator).wakeLock;
    if (!window.isSecureContext || !wakeLock) return;

    let sentinel: WakeLockHandle | null = null;
    let requesting = false;
    const acquire = async () => {
      if (requesting || sentinel || document.visibilityState !== "visible") return;
      requesting = true;
      try {
        const next = await wakeLock.request("screen");
        if (document.visibilityState !== "visible") {
          await next.release();
          return;
        }
        sentinel = next;
        next.addEventListener("release", () => {
          if (sentinel === next) sentinel = null;
        }, { once: true });
      } catch {
        // Il sistema può rifiutare il blocco, ad esempio per batteria scarica.
      } finally {
        requesting = false;
      }
    };
    const release = () => {
      const current = sentinel;
      sentinel = null;
      if (current) void current.release().catch(() => {});
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
      else release();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      release();
    };
  }, []);

  return null;
}
