import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { performNavigation } from './performNavigation';

/**
 * FastoNavigationBridge - Always-mounted component that listens for navigation events
 * This must be mounted in AdminLayout to ensure navigation works from ANY admin tab
 */
export function FastoNavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleFastoNavigate = async (e: CustomEvent<{ url: string; tab?: string }>) => {
      console.log('[FastoNavigationBridge] Navigation event received:', e.detail.url, 'tab:', e.detail.tab);
      const result = await performNavigation(e.detail.url, navigate, e.detail.tab);
      console.log('[FastoNavigationBridge] Navigation result:', result);
    };

    const handlePdfDownload = (e: CustomEvent) => {
      console.log('[FastoNavigationBridge] PDF download requested:', e.detail);
      const data = e.detail;
      if (data?.report_type) {
        window.dispatchEvent(new CustomEvent('fasto-trigger-pdf-download', { detail: data }));
      }
    };

    const handleRefresh = () => {
      console.log('[FastoNavigationBridge] Refreshing page...');
      window.location.reload();
    };

    window.addEventListener('fasto-navigate', handleFastoNavigate as EventListener);
    window.addEventListener('fasto-download-pdf', handlePdfDownload as EventListener);
    window.addEventListener('fasto-refresh-page', handleRefresh);

    console.log('[FastoNavigationBridge] Event listeners mounted');

    return () => {
      window.removeEventListener('fasto-navigate', handleFastoNavigate as EventListener);
      window.removeEventListener('fasto-download-pdf', handlePdfDownload as EventListener);
      window.removeEventListener('fasto-refresh-page', handleRefresh);
      console.log('[FastoNavigationBridge] Event listeners unmounted');
    };
  }, [navigate]);

  return null; // This component renders nothing
}
