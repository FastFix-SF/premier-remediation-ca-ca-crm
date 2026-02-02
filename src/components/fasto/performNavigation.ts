import { Capacitor } from '@capacitor/core';

/**
 * Reliable navigation helper for Fasto
 * Attempts SPA navigation first, then falls back to hard navigation if it fails
 * Includes verification and retry logic to ensure navigation actually renders
 * 
 * SUPPORTS:
 * - Main tabs: home, sales, project-management, financials, workforce, analytics, documents, settings
 * - Subtabs within each main tab (e.g., quotes, proposals, contracts under sales)
 */

// Domains that are BLOCKED in native mode (prevent Safari opening)
const BLOCKED_IN_NATIVE = [
  'lovableproject.com',
  'id-preview--',
  'gpteng.co',
];

// The only allowed domain for native stable builds
const NATIVE_ALLOWED_DOMAIN = 'roofingfriend.lovable.app';

/**
 * Check if a URL should be blocked in native mode
 */
function isBlockedInNative(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return BLOCKED_IN_NATIVE.some(domain => lowerUrl.includes(domain));
}

/**
 * Check if a URL is for an allowed domain (same-site navigation)
 * In native mode: ONLY allow the published domain, block preview domains
 * In web mode: Allow both published and preview domains
 */
function isAllowedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // In native mode, be strict - only allow published domain
    if (Capacitor.isNativePlatform()) {
      // Block any preview/editor domains
      if (isBlockedInNative(url)) {
        return false;
      }
      // Only allow the exact published domain
      return hostname === NATIVE_ALLOWED_DOMAIN || 
             hostname.endsWith('.' + NATIVE_ALLOWED_DOMAIN);
    }
    
    // In web browser mode, allow both published and preview domains
    const WEB_ALLOWED_DOMAINS = [
      'roofingfriend.lovable.app',
      'lovableproject.com',
      'lovable.app'
    ];
    return WEB_ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

/**
 * Convert an absolute URL to a relative path if it's for an allowed domain
 * Returns null if the URL should not be navigated to (blocked in native)
 */
function convertToRelativePath(url: string): string | null {
  try {
    // In native mode, block preview domains entirely
    if (Capacitor.isNativePlatform() && isBlockedInNative(url)) {
      console.warn('[performNavigation] BLOCKED preview URL in native:', url);
      return null;
    }
    
    const urlObj = new URL(url);
    if (isAllowedDomain(url)) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }
  } catch {
    // Not a valid URL
  }
  return null;
}

// Map of expected markers for different tab navigations
const TAB_MARKERS: Record<string, string> = {
  'home': 'admin-home',
  'sales': 'admin-sales',
  'leads': 'admin-sales',
  'quotes': 'admin-sales',
  'proposals': 'admin-sales',
  'contracts': 'admin-sales',
  'project-management': 'admin-projects',
  'projects': 'admin-projects',
  'workforce': 'admin-workforce',
  'summary': 'admin-workforce',
  'directory': 'admin-workforce',
  'opportunities': 'admin-workforce',
  'timesheets': 'admin-workforce',
  'scheduling': 'admin-workforce',
  'tasks': 'admin-workforce',
  'requests': 'admin-workforce',
  'scoring': 'admin-workforce',
  'users': 'admin-workforce',
  'incidents': 'admin-workforce',
  'safety-meetings': 'admin-workforce',
  'financials': 'admin-financials',
  'estimates': 'admin-financials',
  'bid-manager': 'admin-financials',
  'change-orders': 'admin-financials',
  'invoices': 'admin-financials',
  'payments': 'admin-financials',
  'expenses': 'admin-financials',
  'purchase-orders': 'admin-financials',
  'sub-contracts': 'admin-financials',
  'bills': 'admin-financials',
  'transaction-log': 'admin-financials',
  'analytics': 'admin-analytics',
  'documents': 'admin-documents',
  'files-photos': 'admin-documents',
  'reports': 'admin-documents',
  'forms-checklists': 'admin-documents',
  'rfi-notices': 'admin-documents',
  'submittals': 'admin-documents',
  'vehicle-logs': 'admin-documents',
  'equipment-logs': 'admin-documents',
  'notes': 'admin-documents',
  'send-email': 'admin-documents',
  'document-writer': 'admin-documents',
  'settings': 'admin-settings',
  'system': 'admin-settings',
  'security': 'admin-settings',
  'notifications': 'admin-settings',
};

// Map tab names to their trigger data attributes (main tabs)
const TAB_TRIGGER_MAP: Record<string, string> = {
  'home': 'home',
  'sales': 'sales',
  'leads': 'sales',
  'project-management': 'project-management',
  'projects': 'project-management',
  'workforce': 'workforce',
  'financials': 'financials',
  'analytics': 'analytics',
  'documents': 'documents',
  'settings': 'settings',
};

// Map subtab names to their parent main tab
const SUBTAB_TO_MAIN_TAB: Record<string, string> = {
  // Sales subtabs
  'quotes': 'sales',
  'proposals': 'sales',
  'contracts': 'sales',
  // Project Management subtabs
  'projects': 'project-management',
  'daily-logs': 'project-management',
  'schedule': 'project-management',
  'todos': 'project-management',
  'work-orders': 'project-management',
  'inspections': 'project-management',
  'punchlists': 'project-management',
  'service-tickets': 'project-management',
  'permits': 'project-management',
  // Workforce subtabs
  'summary': 'workforce',
  'directory': 'workforce',
  'opportunities': 'workforce',
  'timesheets': 'workforce',
  'scheduling': 'workforce',
  'tasks': 'workforce',
  'requests': 'workforce',
  'scoring': 'workforce',
  'users': 'workforce',
  'incidents': 'workforce',
  'safety-meetings': 'workforce',
  // Financials subtabs
  'estimates': 'financials',
  'bid-manager': 'financials',
  'change-orders': 'financials',
  'invoices': 'financials',
  'payments': 'financials',
  'expenses': 'financials',
  'purchase-orders': 'financials',
  'sub-contracts': 'financials',
  'bills': 'financials',
  'transaction-log': 'financials',
  // Documents subtabs
  'files-photos': 'documents',
  'reports': 'documents',
  'forms-checklists': 'documents',
  'rfi-notices': 'documents',
  'submittals': 'documents',
  'vehicle-logs': 'documents',
  'equipment-logs': 'documents',
  'notes': 'documents',
  'send-email': 'documents',
  'document-writer': 'documents',
  // Settings subtabs
  'team-board': 'settings',
  'feedback': 'settings',
  'general': 'settings',
  'storage': 'settings',
  'integrations': 'settings',
};

/**
 * Wait for a DOM marker to appear AND be active (data-state="active")
 * This is critical for Radix tabs which keep all content in DOM
 */
function waitForActiveMarker(markerValue: string, timeoutMs: number = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      // CRITICAL: Check for ACTIVE state, not just existence
      // Radix TabsContent keeps all tabs in DOM, just with data-state="inactive"
      const element = document.querySelector(
        `[data-fasto-page="${markerValue}"][data-state="active"]`
      );
      
      if (element) {
        console.log('[performNavigation] ACTIVE marker found:', markerValue);
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        console.warn('[performNavigation] Active marker timeout:', markerValue);
        resolve(false);
        return;
      }
      
      requestAnimationFrame(check);
    };
    
    check();
  });
}

/**
 * Try to click the main tab trigger directly to force tab switch
 */
function clickTabTrigger(tabName: string): boolean {
  const triggerName = TAB_TRIGGER_MAP[tabName] || tabName;
  
  // Look for tab trigger with data-fasto-tab attribute
  const trigger = document.querySelector(
    `[data-fasto-tab="${triggerName}"]`
  ) as HTMLElement;
  
  if (trigger) {
    console.log('[performNavigation] Clicking main tab trigger:', triggerName);
    trigger.click();
    return true;
  }
  
  // Fallback: look for TabsTrigger with value matching
  const triggerByValue = document.querySelector(
    `[role="tab"][data-state][value="${triggerName}"], [data-radix-collection-item][value="${triggerName}"]`
  ) as HTMLElement;
  
  if (triggerByValue) {
    console.log('[performNavigation] Clicking main tab trigger by value:', triggerName);
    triggerByValue.click();
    return true;
  }
  
  console.warn('[performNavigation] Main tab trigger not found:', triggerName);
  return false;
}

/**
 * Try to click a subtab trigger
 */
function clickSubtabTrigger(subtabName: string): boolean {
  // Look for subtab trigger with data-fasto-subtab attribute first
  const subtabTrigger = document.querySelector(
    `[data-fasto-subtab="${subtabName}"]`
  ) as HTMLElement;
  
  if (subtabTrigger) {
    console.log('[performNavigation] Clicking subtab trigger:', subtabName);
    subtabTrigger.click();
    return true;
  }
  
  // Fallback: look for any tab trigger with value matching (within the active content)
  const activeContent = document.querySelector('[data-state="active"][data-fasto-page]');
  if (activeContent) {
    const subtabByValue = activeContent.querySelector(
      `[role="tab"][value="${subtabName}"]`
    ) as HTMLElement;
    
    if (subtabByValue) {
      console.log('[performNavigation] Clicking subtab by value in active content:', subtabName);
      subtabByValue.click();
      return true;
    }
  }
  
  // Final fallback: search the whole document for tab with matching value
  const subtabGlobal = document.querySelector(
    `[role="tab"][value="${subtabName}"]:not([data-fasto-tab])`
  ) as HTMLElement;
  
  if (subtabGlobal) {
    console.log('[performNavigation] Clicking subtab by value (global):', subtabName);
    subtabGlobal.click();
    return true;
  }
  
  console.warn('[performNavigation] Subtab trigger not found:', subtabName);
  return false;
}

/**
 * Check if a tab name is a subtab
 */
function isSubtab(tabName: string): boolean {
  return tabName in SUBTAB_TO_MAIN_TAB;
}

/**
 * Get the parent main tab for a subtab
 */
function getParentMainTab(subtabName: string): string | null {
  return SUBTAB_TO_MAIN_TAB[subtabName] || null;
}

/**
 * Extract tab name from URL or explicit parameter
 */
function extractTabFromUrl(url: string): string | null {
  // Check for ?tab= parameter
  const tabMatch = url.match(/[?&]tab=([^&]+)/);
  if (tabMatch) return tabMatch[1];
  
  // Also check hash-based tabs
  const hashMatch = url.match(/#([^?]+)/);
  if (hashMatch) return hashMatch[1];
  
  return null;
}

/**
 * Extract subtab name from URL
 */
function extractSubtabFromUrl(url: string): string | null {
  const subtabMatch = url.match(/[?&]subtab=([^&]+)/);
  return subtabMatch ? subtabMatch[1] : null;
}

/**
 * Perform navigation with optional target tab
 * @param url - The URL to navigate to
 * @param navigateFn - React Router navigate function
 * @param targetTab - Optional: specific tab to activate (useful when URL doesn't change)
 */
export function performNavigation(
  url: string,
  navigateFn: (path: string) => void,
  targetTab?: string
): Promise<boolean> {
  return new Promise(async (resolve) => {
    // Normalize URL
    let normalizedUrl = url.trim();
    
    // Handle absolute URLs
    if (normalizedUrl.startsWith('http://') || normalizedUrl.startsWith('https://')) {
      // Check if this is actually a same-site URL (allowed domain)
      const relativePath = convertToRelativePath(normalizedUrl);
      
      if (relativePath) {
        // Convert to relative path and continue with SPA navigation
        console.log('[performNavigation] Converting same-site absolute URL to relative:', relativePath);
        normalizedUrl = relativePath;
      } else {
        // Truly external URL
        if (Capacitor.isNativePlatform()) {
          // Block external navigation in native app to prevent Safari from opening
          console.log('[performNavigation] BLOCKED external URL in native app:', normalizedUrl);
          // Could optionally show a toast here
          resolve(false);
          return;
        }
        
        // In web browser, allow external navigation
        console.log('[performNavigation] External URL, using window.location.assign:', normalizedUrl);
        window.location.assign(normalizedUrl);
        resolve(true);
        return;
      }
    }
    
    // Ensure it starts with /
    if (!normalizedUrl.startsWith('/')) {
      normalizedUrl = '/' + normalizedUrl;
    }
    
    // Get current location before navigation
    const currentPathname = window.location.pathname;
    const currentSearch = window.location.search;
    const beforePath = currentPathname + currentSearch;
    
    // Extract tab AND subtab from URL
    const tabFromUrl = extractTabFromUrl(normalizedUrl);
    const subtabFromUrl = extractSubtabFromUrl(normalizedUrl);
    
    // Determine the effective tab: subtab takes priority if present
    // If subtab is in URL, that's what we want to navigate to
    const effectiveTab = subtabFromUrl || targetTab || tabFromUrl;
    const expectedMarker = effectiveTab ? TAB_MARKERS[effectiveTab] : null;
    
    console.log('[performNavigation] Extracted:', { tabFromUrl, subtabFromUrl, effectiveTab });
    
    // Get target pathname (without query params)
    const targetPathname = normalizedUrl.split('?')[0].split('#')[0];
    
    console.log('[performNavigation] Navigation request:', {
      url: normalizedUrl,
      targetTab,
      effectiveTab,
      expectedMarker,
      currentPathname,
      targetPathname
    });
    
    // ===== CRITICAL FIX: Handle same-pathname tab switching =====
    // When URL contains tab= or subtab=, ALWAYS update URL via navigateFn
    // This ensures React Router triggers searchParams change, which AdminDashboard listens to
    if (currentPathname === targetPathname && effectiveTab) {
      console.log('[performNavigation] Same pathname, switching tab to:', effectiveTab);
      
      // Check if this is a subtab - if so, we need parent main tab
      const subtabParent = getParentMainTab(effectiveTab);
      const isSubtabNav = isSubtab(effectiveTab);
      
      console.log('[performNavigation] Subtab check:', { isSubtabNav, subtabParent, effectiveTab });
      
      // ===== KEY FIX: Always update URL for subtab navigation =====
      // This triggers React Router to update searchParams, which AdminDashboard picks up
      if (subtabFromUrl || isSubtabNav) {
        const mainTab = subtabParent || tabFromUrl || 'home';
        const subtab = subtabFromUrl || effectiveTab;
        const newUrl = `${targetPathname}?tab=${mainTab}&subtab=${subtab}`;
        
        console.log('[performNavigation] Updating URL for subtab navigation:', newUrl);
        
        // Update URL via React Router - this triggers AdminDashboard's useEffect
        navigateFn(newUrl);
        
        // Also dispatch event as backup for immediate state update
        window.dispatchEvent(new CustomEvent('assistantNavigate', {
          detail: { mainTab, subTab: subtab }
        }));
        
        // Wait for main tab to render, then verify subtab is active
        const mainTabMarker = TAB_MARKERS[mainTab];
        if (mainTabMarker) {
          await waitForActiveMarker(mainTabMarker, 800);
        }
        
        // Give React time to apply the subtab state change
        await new Promise(r => setTimeout(r, 150));
        
        console.log('[performNavigation] Subtab navigation complete via URL update');
        resolve(true);
        return;
      }
      
      // Check if the target marker is already active (main tab only)
      const alreadyActive = document.querySelector(
        `[data-fasto-page="${expectedMarker}"][data-state="active"]`
      );
      
      if (alreadyActive) {
        console.log('[performNavigation] Target tab already active');
        resolve(true);
        return;
      }
      
      // MAIN TAB NAVIGATION (not a subtab)
      if (alreadyActive) {
        console.log('[performNavigation] Target tab already active');
        resolve(true);
        return;
      }
      
      // Click the tab trigger
      const clicked = clickTabTrigger(effectiveTab);
      
      if (clicked) {
        // Dispatch assistantNavigate event for components listening to it
        window.dispatchEvent(new CustomEvent('assistantNavigate', {
          detail: { mainTab: effectiveTab }
        }));
        
        // Also dispatch a custom fasto-tab-change event as backup
        window.dispatchEvent(new CustomEvent('fasto-tab-change', {
          detail: { tab: effectiveTab }
        }));
        
        // Wait for the marker to become active
        const markerActive = await waitForActiveMarker(expectedMarker!, 1200);
        
        if (markerActive) {
          console.log('[performNavigation] Tab switch successful');
          resolve(true);
          return;
        }
        
        // Retry with a second click
        console.warn('[performNavigation] First tab click didn\'t activate marker, retrying...');
        clickTabTrigger(effectiveTab);
        
        const retryActive = await waitForActiveMarker(expectedMarker!, 800);
        if (retryActive) {
          console.log('[performNavigation] Tab switch successful on retry');
          resolve(true);
          return;
        }
      }
      
      // Last resort for same-pathname: force navigation with query param
      console.warn('[performNavigation] Tab click failed, forcing URL change');
      const urlWithTab = `${targetPathname}?tab=${effectiveTab}`;
      navigateFn(urlWithTab);
      
      // Wait and verify
      setTimeout(async () => {
        const finalActive = await waitForActiveMarker(expectedMarker!, 1000);
        if (!finalActive) {
          window.location.assign(urlWithTab);
        }
        resolve(true);
      }, 200);
      return;
    }
    
    // ===== Standard navigation (different pathname) =====
    console.log('[performNavigation] Different pathname, performing SPA navigate:', normalizedUrl);
    
    // Attempt SPA navigation
    try {
      navigateFn(normalizedUrl);
    } catch (err) {
      console.error('[performNavigation] SPA navigate threw:', err);
      window.location.assign(normalizedUrl);
      resolve(true);
      return;
    }
    
    // Verify navigation and handle tab switching
    setTimeout(async () => {
      const afterPathname = window.location.pathname;
      
      console.log('[performNavigation] After SPA navigate:', afterPathname, 'target:', targetPathname);
      
      // Check if we reached the target pathname
      if (afterPathname === targetPathname) {
        console.log('[performNavigation] SPA navigation pathname matched');
        
        // If we need a specific tab, click it now
        if (effectiveTab && expectedMarker) {
          // Check if already active
          const alreadyActive = document.querySelector(
            `[data-fasto-page="${expectedMarker}"][data-state="active"]`
          );
          
          if (alreadyActive) {
            console.log('[performNavigation] Target tab already active after navigation');
            resolve(true);
            return;
          }
          
          // Click the tab trigger
          console.log('[performNavigation] Clicking tab after navigation:', effectiveTab);
          
          // Dispatch events
          window.dispatchEvent(new CustomEvent('assistantNavigate', {
            detail: { mainTab: effectiveTab }
          }));
          
          clickTabTrigger(effectiveTab);
          
          // Wait for marker
          const markerActive = await waitForActiveMarker(expectedMarker, 1000);
          
          if (markerActive) {
            console.log('[performNavigation] Tab activated after navigation');
            resolve(true);
            return;
          }
          
          // Retry
          clickTabTrigger(effectiveTab);
          const retryActive = await waitForActiveMarker(expectedMarker, 800);
          
          if (retryActive) {
            resolve(true);
            return;
          }
          
          // Force hard navigation as last resort
          console.warn('[performNavigation] Tab activation failed, forcing hard navigation');
          window.location.assign(normalizedUrl);
          resolve(true);
          return;
        }
        
        // No tab to switch, navigation complete
        resolve(true);
        return;
      }
      
      // Didn't reach target, fallback to hard navigation
      console.warn('[performNavigation] SPA navigation failed, falling back to hard navigation');
      window.location.assign(normalizedUrl);
      resolve(true);
    }, 150);
  });
}
