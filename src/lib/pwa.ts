export const isStandalonePWA = (): boolean => {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS fallback:
    (window.navigator as any).standalone === true
  );
};

export const trackPWAUsage = () => {
  const displayMode = isStandalonePWA() ? 'standalone' : 'browser';
  
  // Track analytics if available
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'pwa_usage', {
      display_mode: displayMode
    });
  }
  
  console.log(`PWA Display Mode: ${displayMode}`);
};