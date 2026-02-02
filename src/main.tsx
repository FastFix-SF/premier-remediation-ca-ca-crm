import { Buffer } from 'buffer'
import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ===== NATIVE APP NAVIGATION FIREWALL =====
// Block any attempt to navigate to preview/editor domains in native builds
// This prevents Safari from opening when tooling or code tries to redirect
const BLOCKED_DOMAINS_IN_NATIVE = [
  'lovableproject.com',
  'id-preview--',  // preview subdomains
  'gpteng.co',     // Lovable CDN/tooling
];

function isBlockedNavigationTarget(url: string): boolean {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  return BLOCKED_DOMAINS_IN_NATIVE.some(domain => lowerUrl.includes(domain));
}

// Install navigation firewall BEFORE anything else runs
if (Capacitor.isNativePlatform()) {
  console.log('[Native] Installing navigation firewall...');
  
  // Configure status bar for proper safe area handling
  StatusBar.setStyle({ style: Style.Light }).catch(e => console.warn('[Native] StatusBar setStyle failed:', e));
  StatusBar.setOverlaysWebView({ overlay: true }).catch(e => console.warn('[Native] StatusBar setOverlaysWebView failed:', e));
  
  // Block window.open to blocked domains
  const originalWindowOpen = window.open;
  window.open = function(url?: string | URL, target?: string, features?: string) {
    const urlStr = url?.toString() || '';
    if (isBlockedNavigationTarget(urlStr)) {
      console.warn('[Native] BLOCKED window.open to:', urlStr);
      return null;
    }
    return originalWindowOpen.call(window, url, target, features);
  };
  
  // Best-effort: try to intercept location.assign and location.replace
  // These may not be overridable in all browsers, but worth trying
  try {
    const originalAssign = Location.prototype.assign;
    Location.prototype.assign = function(url: string) {
      if (Capacitor.isNativePlatform() && isBlockedNavigationTarget(url)) {
        console.warn('[Native] BLOCKED location.assign to:', url);
        return;
      }
      return originalAssign.call(this, url);
    };
    
    const originalReplace = Location.prototype.replace;
    Location.prototype.replace = function(url: string) {
      if (Capacitor.isNativePlatform() && isBlockedNavigationTarget(url)) {
        console.warn('[Native] BLOCKED location.replace to:', url);
        return;
      }
      return originalReplace.call(this, url);
    };
  } catch (e) {
    console.warn('[Native] Could not patch Location.prototype:', e);
  }
  
  console.log('[Native] Navigation firewall installed');
}

// IMMEDIATELY redirect to mobile routes if running as native Capacitor app
// This runs BEFORE React renders anything to prevent white screen flash
// Using a flag to prevent React from mounting during redirect
let isRedirecting = false;

if (Capacitor.isNativePlatform()) {
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith('/mobile')) {
    isRedirecting = true;
    window.location.replace('/mobile/home');
  }
}

// Only proceed with React mounting if we're not redirecting
if (isRedirecting) {
  // Don't mount React - we're redirecting
  console.log('[Native] Redirecting to mobile home, skipping React mount');
} else {

// Polyfill Buffer for @react-pdf/renderer (uses Node.js Buffer for image handling)
globalThis.Buffer = Buffer

// ===== PWA / Service Worker =====
// In the Lovable preview + during development, stale SW caches can cause
// "Failed to fetch dynamically imported module" (blank screen).
// So we:
// 1) Avoid registering SW in DEV.
// 2) Provide a recovery path that clears SW + caches and reloads on chunk-load failures.

const clearServiceWorkersAndCaches = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(regs.map((r) => r.unregister()));

    // Clear Cache Storage (best-effort)
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    // best-effort cleanup only
    console.warn('[SW] cleanup failed', e);
  }
};

// Recover from dynamic import/chunk load failures by clearing caches and reloading.
// We allow a small number of retries per session because in some environments
// (e.g. stale SW controlling the page) the first cleanup+reload may not be enough.
const maybeRecoverFromChunkLoadError = (message?: string) => {
  if (!message) return;

  const isChunkLoadError =
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('ChunkLoadError');

  if (!isChunkLoadError) return;

  const key = '__chunk_reload_count__';
  const count = Number(sessionStorage.getItem(key) || '0');
  if (count >= 2) return;

  sessionStorage.setItem(key, String(count + 1));
  clearServiceWorkersAndCaches().finally(() => window.location.reload());
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event as PromiseRejectionEvent).reason;
  const message = typeof reason === 'string' ? reason : (reason?.message as string | undefined);
  maybeRecoverFromChunkLoadError(message);
});

// Some browsers surface dynamic-import failures as window "error" instead of unhandledrejection
window.addEventListener('error', (event) => {
  const message = (event as ErrorEvent).message;
  maybeRecoverFromChunkLoadError(message);
});

// In DEV/Lovable preview, proactively clear any previously registered SW/caches
// ASAP (not only on window.load) to avoid SW intercepting the first dynamic imports.
const isLovablePreview = window.location.hostname.includes('lovableproject.com');
if (import.meta.env.DEV || isLovablePreview) {
  clearServiceWorkersAndCaches();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Lovable preview uses Vite dev URLs (/src/*?t=...), which should NEVER be cached by a SW.
    // Treat lovableproject.com like DEV to prevent blank screens from stale SW caches.
    const isLovablePreview = window.location.hostname.includes('lovableproject.com');

    if (import.meta.env.DEV || isLovablePreview) {
      // DEV / Lovable preview: do not register SW (and also remove any previously registered SW).
      clearServiceWorkersAndCaches();
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New content available! Please refresh.');
                // You could show a toast notification here
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Track PWA usage
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running as PWA');
  // Track analytics for PWA usage
} else {
  console.log('Running in browser');
}

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
