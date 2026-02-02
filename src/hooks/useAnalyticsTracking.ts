import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Generate or retrieve visitor ID from localStorage
const getVisitorId = (): string => {
  let visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('visitor_id', visitorId);
  }
  return visitorId;
};

// Generate session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

export const useAnalyticsTracking = () => {
  const location = useLocation();
  const prevLocationRef = useRef<string>('');

  const trackEvent = async (eventType: string, pagePath?: string, additionalData?: any) => {
    // Defer analytics to not block main thread during initial page load
    const deferredTrack = async () => {
      try {
        await supabase.from('analytics_events').insert({
          event_type: eventType,
          page_path: pagePath || location.pathname + location.search,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent,
          session_id: getSessionId(),
          visitor_id: getVisitorId(),
          ...additionalData
        });
      } catch (error) {
        console.error('Analytics tracking error:', error);
      }
    };

    // Use requestIdleCallback for better performance, fallback to setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => deferredTrack(), { timeout: 2000 });
    } else {
      setTimeout(() => deferredTrack(), 100);
    }
  };

  // Track page views with delay to not block initial render
  useEffect(() => {
    const currentPath = location.pathname + location.search;
    
    // Only track if the path has changed
    if (currentPath !== prevLocationRef.current) {
      // Delay page view tracking to prioritize initial page interactivity
      setTimeout(() => {
        trackEvent('page_view', currentPath);
      }, 300);
      prevLocationRef.current = currentPath;
    }
  }, [location]);

  return { trackEvent };
};