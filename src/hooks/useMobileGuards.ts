import { useLocation } from 'react-router-dom';
import { useMobileContext } from '@/contexts/MobileContext';

export const useMobileGuards = () => {
  const location = useLocation();
  const { isMobileRoute, isPWAMode, isMobileApp } = useMobileContext();

  // Development safety guards
  const ensureMobileRoute = (action: () => void) => {
    if (!isMobileRoute) {
      console.warn('[Mobile Guard] Attempted to execute mobile-only code outside mobile routes');
      return;
    }
    action();
  };

  const ensureWebRoute = (action: () => void) => {
    if (isMobileRoute) {
      console.warn('[Web Guard] Attempted to execute web-only code inside mobile routes');
      return;
    }
    action();
  };

  // Safe mobile feature toggles
  const withMobileFeature = <T>(mobileValue: T, webValue: T): T => {
    return isMobileRoute ? mobileValue : webValue;
  };

  // Component isolation helpers
  const renderForMobile = (component: React.ReactNode): React.ReactNode => {
    return isMobileRoute ? component : null;
  };

  const renderForWeb = (component: React.ReactNode): React.ReactNode => {
    return !isMobileRoute ? component : null;
  };

  // Safe hook execution
  const useMobileHook = <T>(hook: () => T, fallback: T): T => {
    if (!isMobileRoute) {
      return fallback;
    }
    return hook();
  };

  return {
    isMobileRoute,
    isPWAMode,
    isMobileApp,
    ensureMobileRoute,
    ensureWebRoute,
    withMobileFeature,
    renderForMobile,
    renderForWeb,
    useMobileHook
  };
};