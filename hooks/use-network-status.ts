import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

async function checkConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://clients3.google.com/generate_204", {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return res.status === 204;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const appState = useRef(AppState.currentState);

  const check = async () => {
    const online = await checkConnectivity();
    setIsOnline(online);
  };

  useEffect(() => {
    check();

    // Re-check when app comes to foreground
    const sub = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === "active"
        ) {
          check();
        }
        appState.current = nextState;
      },
    );

    // Poll every 15s
    const interval = setInterval(check, 15000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, []);

  return { isOnline };
}
