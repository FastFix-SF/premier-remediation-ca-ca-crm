import { useAnalyticsTracking } from '@/hooks/useAnalyticsTracking';

const AnalyticsTracker = () => {
  useAnalyticsTracking();
  return null; // This component doesn't render anything
};

export default AnalyticsTracker;