import React from 'react';
import { Outlet } from 'react-router-dom';
import { FastoGlobalWidget } from '@/components/fasto/FastoGlobalWidget';
import { FastoNavigationBridge } from '@/components/fasto/FastoNavigationBridge';
import { FastoActionRegistry } from '@/components/fasto/FastoActionRegistry';
import { FastoActionOverlay } from '@/components/fasto/FastoActionOverlay';
import { useFastoDataRefresh } from '@/hooks/useFastoDataRefresh';

/**
 * Shared layout for all /admin/* routes
 * Ensures Fasto persists across navigation (no unmount/remount)
 * FastoActionRegistry enables voice control of all entities
 */
export const AdminLayout: React.FC = () => {
  // Enable smart data refresh for Fasto actions (no page reload needed)
  useFastoDataRefresh();
  
  return (
    <FastoActionRegistry>
      {/* Navigation bridge - always mounted for voice navigation from any tab */}
      <FastoNavigationBridge />
      
      {/* Page content from nested routes */}
      <Outlet />
      
      {/* Global Fasto widget - always mounted for all admin pages */}
      <FastoGlobalWidget />
      
      {/* Live action overlay - shows what Fasto is doing */}
      <FastoActionOverlay />
    </FastoActionRegistry>
  );
};

export default AdminLayout;
