import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Phrases that indicate Fasto couldn't handle a request
const FAILURE_PHRASES = [
  "i can't do that",
  "i don't have access",
  "that feature isn't available",
  "i'm not able to",
  "i cannot",
  "i'm unable to",
  "that's not something i can",
  "i don't have the ability",
  "currently not supported",
  "not yet implemented",
  "i can't help with that",
  "outside my capabilities",
  "beyond what i can do",
  "not within my abilities"
];

// Categories for failed requests
const CATEGORY_PATTERNS: Record<string, string[]> = {
  navigation: ['go to', 'take me to', 'navigate', 'open', 'show me', 'find'],
  purchasing: ['buy', 'purchase', 'order', 'supplier', 'vendor', 'material order', 'procurement'],
  scheduling: ['schedule', 'calendar', 'appointment', 'meeting', 'shift', 'time off'],
  communications: ['email', 'text', 'message', 'call', 'notify', 'send'],
  documents: ['document', 'pdf', 'contract', 'proposal', 'report', 'file'],
  finance: ['invoice', 'payment', 'bill', 'expense', 'budget', 'cost'],
  hr: ['employee', 'hire', 'payroll', 'benefits', 'training'],
  safety: ['safety', 'incident', 'inspection', 'compliance', 'osha']
};

export function useFastoFailureTracking() {
  const detectCategory = useCallback((requestText: string): string => {
    const lowerText = requestText.toLowerCase();
    
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      if (patterns.some(pattern => lowerText.includes(pattern))) {
        return category;
      }
    }
    
    return 'uncategorized';
  }, []);

  const isFailureResponse = useCallback((response: string): boolean => {
    const lowerResponse = response.toLowerCase();
    return FAILURE_PHRASES.some(phrase => lowerResponse.includes(phrase));
  }, []);

  const extractFailureReason = useCallback((response: string): string => {
    // Try to extract a meaningful reason from the response
    const sentences = response.split(/[.!?]+/).filter(s => s.trim());
    
    // Look for sentences that explain why
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (
        lower.includes("because") ||
        lower.includes("don't have") ||
        lower.includes("can't") ||
        lower.includes("unable") ||
        lower.includes("not") ||
        lower.includes("currently")
      ) {
        return sentence.trim();
      }
    }
    
    // Return first sentence as fallback
    return sentences[0]?.trim() || 'Unable to process request';
  }, []);

  const logFailedRequest = useCallback(async (
    requestText: string,
    agentResponse: string,
    toolAttempted?: string
  ) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const category = detectCategory(requestText);
      const failureReason = extractFailureReason(agentResponse);
      
      const { error } = await supabase.from('fasto_failed_requests').insert({
        user_id: user?.id || null,
        request_text: requestText.slice(0, 1000), // Limit length
        agent_response: agentResponse.slice(0, 2000),
        failure_reason: failureReason.slice(0, 500),
        tool_attempted: toolAttempted || null,
        category
      });

      if (error) {
        console.error('[FastoFailureTracking] Error logging failed request:', error);
      } else {
        console.log('[FastoFailureTracking] Logged failed request:', { category, failureReason });
      }
    } catch (err) {
      console.error('[FastoFailureTracking] Exception logging failed request:', err);
    }
  }, [detectCategory, extractFailureReason]);

  const checkAndLogFailure = useCallback(async (
    userRequest: string,
    assistantResponse: string,
    toolAttempted?: string
  ) => {
    if (isFailureResponse(assistantResponse)) {
      await logFailedRequest(userRequest, assistantResponse, toolAttempted);
      return true;
    }
    return false;
  }, [isFailureResponse, logFailedRequest]);

  return {
    isFailureResponse,
    logFailedRequest,
    checkAndLogFailure,
    detectCategory
  };
}
