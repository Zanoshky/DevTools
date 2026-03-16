
import { useSyncExternalStore, useCallback } from "react";

type Listener = () => void;

// Singleton state — shared across all hook consumers
let networkCalls: string[] = [];
let isMonitoring = false;
let isSetup = false;
let listeners: Set<Listener> = new Set();
const MAX_CALLS = 50;

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  listeners.forEach((l) => l());
}

function addCall(entry: string) {
  networkCalls = [entry, ...networkCalls].slice(0, MAX_CALLS);
  notify();
}

function setup() {
  if (isSetup || typeof window === "undefined") return;
  isSetup = true;

  const originalFetch = window.fetch;
  const originalXHR = window.XMLHttpRequest.prototype.open;
  const originalBeacon = navigator.sendBeacon?.bind(navigator);
  const OriginalWebSocket = window.WebSocket;

  window.fetch = function (...args) {
    const url = args[0]?.toString() || "";
    if (!url.startsWith(window.location.origin) && !url.startsWith("/")) {
      addCall(`[fetch] ${url}`);
    }
    return originalFetch.apply(this, args);
  };

  const xhrOpen = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    const urlStr = url.toString();
    if (!urlStr.startsWith(window.location.origin) && !urlStr.startsWith("/")) {
      addCall(`[xhr] ${urlStr}`);
    }
    return originalXHR.call(this, method, url, async, username, password);
  };
  window.XMLHttpRequest.prototype.open = xhrOpen as typeof originalXHR;

  if (originalBeacon) {
    navigator.sendBeacon = function (url: string, data?: BodyInit | null) {
      if (!url.startsWith(window.location.origin) && !url.startsWith("/")) {
        addCall(`[beacon] ${url}`);
      }
      return originalBeacon(url, data);
    };
  }

  window.WebSocket = class extends OriginalWebSocket {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      const urlStr = url.toString();
      if (!urlStr.startsWith(window.location.origin.replace("http", "ws"))) {
        addCall(`[ws] ${urlStr}`);
      }
    }
  } as typeof WebSocket;

  isMonitoring = true;
  notify();
}

function getSnapshot() {
  return { networkCalls, isMonitoring, isClean: networkCalls.length === 0 };
}

// Cached server snapshot — must be a stable reference to avoid infinite loop
const SERVER_SNAPSHOT = Object.freeze({ networkCalls: [] as string[], isMonitoring: false, isClean: true });

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

// Stable reference for snapshot — only changes when data changes
let cachedSnapshot = getSnapshot();
function getStableSnapshot() {
  const next = getSnapshot();
  if (
    next.networkCalls !== cachedSnapshot.networkCalls ||
    next.isMonitoring !== cachedSnapshot.isMonitoring
  ) {
    cachedSnapshot = next;
  }
  return cachedSnapshot;
}

export function useNetworkMonitor() {
  // Setup once on first use
  if (typeof window !== "undefined" && !isSetup) {
    setup();
  }

  const snapshot = useSyncExternalStore(subscribe, getStableSnapshot, getServerSnapshot);
  return snapshot;
}
