/**
 * Fasto Visual Automation Module
 * Core utilities for visually interacting with UI elements step-by-step
 * Emits events to FastoActionOverlay for live visual feedback
 */

export interface VisualFeedback {
  onHighlight?: (element: HTMLElement, label: string) => void;
  onAction?: (action: string) => void;
  onSpeak?: (text: string) => Promise<void>;
}

// Highlight durations
const HIGHLIGHT_DURATION_MS = 600;
const CLICK_HIGHLIGHT_MS = 400;

/**
 * Emit a visual step event for the overlay to display
 */
export function emitVisualStep(action: string, step: string, status?: 'running' | 'success' | 'error', element?: string): void {
  window.dispatchEvent(new CustomEvent('fasto-visual-step', {
    detail: { action, step, status: status || 'running', element }
  }));
}

/**
 * Emit action complete event
 */
export function emitActionComplete(success: boolean = true): void {
  window.dispatchEvent(new CustomEvent('fasto-action-complete', {
    detail: { success }
  }));
}

/**
 * Highlight an element with a green glow to show Fasto is interacting with it
 */
export function highlightElement(element: HTMLElement, durationMs: number = HIGHLIGHT_DURATION_MS): Promise<void> {
  // Emit visual step
  const elementDesc = element.getAttribute('data-fasto-action') || 
                      element.getAttribute('aria-label') || 
                      element.tagName.toLowerCase();
  emitVisualStep('Highlighting', `Focusing on ${elementDesc}`, 'running', elementDesc);
  
  return new Promise(resolve => {
    const originalOutline = element.style.outline;
    const originalOutlineOffset = element.style.outlineOffset;
    const originalTransition = element.style.transition;
    const originalZIndex = element.style.zIndex;
    const originalBoxShadow = element.style.boxShadow;
    
    // Add prominent green glow effect
    element.style.outline = '3px solid #22c55e';
    element.style.outlineOffset = '3px';
    element.style.transition = 'outline 0.2s ease, box-shadow 0.2s ease';
    element.style.zIndex = '9999';
    element.style.boxShadow = '0 0 20px 5px rgba(34, 197, 94, 0.4)';
    
    setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.outlineOffset = originalOutlineOffset;
      element.style.transition = originalTransition;
      element.style.zIndex = originalZIndex;
      element.style.boxShadow = originalBoxShadow;
      resolve();
    }, durationMs);
  });
}

/**
 * Simulate a click on an element with proper event dispatching for React
 */
export function simulateClick(element: HTMLElement): void {
  const elementDesc = element.getAttribute('data-fasto-action') || 
                      element.textContent?.slice(0, 30) || 
                      element.tagName.toLowerCase();
  emitVisualStep('Clicking', `Clicking ${elementDesc}`, 'running', elementDesc);
  
  console.log('[FastoVisual] Simulating click on:', element);
  
  // Focus the element first
  element.focus();
  
  // Dispatch pointer events for better React/Radix handling
  const pointerDown = new PointerEvent('pointerdown', { bubbles: true, cancelable: true, view: window });
  const pointerUp = new PointerEvent('pointerup', { bubbles: true, cancelable: true, view: window });
  
  // Dispatch mouse events
  const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
  const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
  const click = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
  
  element.dispatchEvent(pointerDown);
  element.dispatchEvent(mouseDown);
  element.dispatchEvent(pointerUp);
  element.dispatchEvent(mouseUp);
  element.dispatchEvent(click);
}

/**
 * Wait for an element to appear in the DOM (checks globally for portals)
 */
export function waitForElement(selector: string, timeoutMs: number = 3000): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      // Check globally (important for Radix portals that render at body level)
      const element = document.querySelector(selector) as HTMLElement;
      if (element && element.offsetParent !== null) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeoutMs) {
        console.warn('[FastoVisual] Element timeout:', selector);
        resolve(null);
        return;
      }
      
      requestAnimationFrame(check);
    };
    
    check();
  });
}

/**
 * Wait for an element by data-fasto attribute
 */
export function waitForFastoElement(
  fastoAction: string, 
  timeoutMs: number = 3000
): Promise<HTMLElement | null> {
  return waitForElement(`[data-fasto-action="${fastoAction}"]`, timeoutMs);
}

/**
 * Wait for a dialog to open
 */
export function waitForDialog(
  dialogName?: string,
  timeoutMs: number = 2000
): Promise<HTMLElement | null> {
  const selector = dialogName 
    ? `[data-fasto-dialog="${dialogName}"], [role="dialog"]:has([data-fasto-dialog="${dialogName}"])`
    : '[role="dialog"]';
  return waitForElement(selector, timeoutMs);
}

/**
 * Scroll an element into view smoothly
 */
export function scrollIntoViewIfNeeded(element: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const rect = element.getBoundingClientRect();
    const isInView = rect.top >= 0 && rect.bottom <= window.innerHeight;
    
    if (!isInView) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Wait for scroll to complete
      setTimeout(resolve, 400);
    } else {
      resolve();
    }
  });
}

/**
 * Fill an input field with visual feedback
 */
export async function fillInputField(
  selector: string, 
  value: string,
  options?: { highlightDuration?: number }
): Promise<boolean> {
  emitVisualStep('Typing', `Entering "${value.slice(0, 20)}${value.length > 20 ? '...' : ''}"`, 'running', selector);
  
  const input = await waitForElement(selector) as HTMLInputElement | HTMLTextAreaElement;
  
  if (!input) {
    console.warn('[FastoVisual] Input not found:', selector);
    emitVisualStep('Error', `Could not find input field`, 'error', selector);
    return false;
  }
  
  await scrollIntoViewIfNeeded(input);
  await highlightElement(input, options?.highlightDuration ?? HIGHLIGHT_DURATION_MS);
  
  // Focus the input
  input.focus();
  input.select?.();
  
  // Set value using native setter to trigger React state update
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
    'value'
  )?.set;
  
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else {
    input.value = value;
  }
  
  // Dispatch events to trigger React onChange
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  emitVisualStep('Typing', `Entered "${value.slice(0, 20)}${value.length > 20 ? '...' : ''}"`, 'success', selector);
  
  return true;
}

/**
 * Click an element with visual highlight
 */
export async function clickWithHighlight(
  selector: string,
  options?: { waitAfter?: number; highlightDuration?: number }
): Promise<boolean> {
  const element = await waitForElement(selector);
  
  if (!element) {
    console.warn('[FastoVisual] Element not found for click:', selector);
    emitVisualStep('Error', `Could not find element to click`, 'error', selector);
    return false;
  }
  
  await scrollIntoViewIfNeeded(element);
  await highlightElement(element, options?.highlightDuration ?? CLICK_HIGHLIGHT_MS);
  simulateClick(element);
  
  if (options?.waitAfter) {
    await delay(options.waitAfter);
  }
  
  return true;
}

/**
 * Click a Fasto-tagged element
 */
export async function clickFastoAction(
  fastoAction: string,
  options?: { waitAfter?: number; highlightDuration?: number }
): Promise<boolean> {
  return clickWithHighlight(`[data-fasto-action="${fastoAction}"]`, options);
}

/**
 * Open a dropdown/select and choose an option
 */
export async function selectDropdownOption(
  triggerSelector: string,
  optionValue: string | ((options: HTMLElement[]) => HTMLElement | null)
): Promise<boolean> {
  // Click the trigger
  const trigger = await waitForElement(triggerSelector);
  if (!trigger) return false;
  
  await scrollIntoViewIfNeeded(trigger);
  await highlightElement(trigger, CLICK_HIGHLIGHT_MS);
  simulateClick(trigger);
  
  // Wait for dropdown to open
  await delay(300);
  
  // Find the option
  let option: HTMLElement | null = null;
  
  if (typeof optionValue === 'string') {
    // Search by value or text content
    option = document.querySelector(`[data-value="${optionValue}"]`) as HTMLElement
      || document.querySelector(`[role="option"]:has-text("${optionValue}")`) as HTMLElement;
    
    // Fallback: search all options
    if (!option) {
      const allOptions = document.querySelectorAll('[role="option"], [role="menuitem"], [cmdk-item]');
      for (const opt of allOptions) {
        if (opt.textContent?.toLowerCase().includes(optionValue.toLowerCase())) {
          option = opt as HTMLElement;
          break;
        }
      }
    }
  } else {
    const allOptions = Array.from(document.querySelectorAll('[role="option"], [role="menuitem"]')) as HTMLElement[];
    option = optionValue(allOptions);
  }
  
  if (!option) {
    console.warn('[FastoVisual] Option not found:', optionValue);
    // Close dropdown
    document.body.click();
    return false;
  }
  
  await highlightElement(option, CLICK_HIGHLIGHT_MS);
  simulateClick(option);
  
  return true;
}

/**
 * Type text character by character with visual effect (typewriter style)
 */
export async function typeTextAnimated(
  selector: string,
  text: string,
  options?: { charDelayMs?: number }
): Promise<boolean> {
  const input = await waitForElement(selector) as HTMLInputElement | HTMLTextAreaElement;
  
  if (!input) return false;
  
  await scrollIntoViewIfNeeded(input);
  await highlightElement(input, 300);
  input.focus();
  
  const charDelay = options?.charDelayMs ?? 30;
  
  for (let i = 0; i < text.length; i++) {
    const currentValue = text.slice(0, i + 1);
    
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype,
      'value'
    )?.set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(input, currentValue);
    }
    
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    await delay(charDelay);
  }
  
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  return true;
}

/**
 * Navigate to a page and wait for it to load
 */
export function navigateToPage(url: string, tab?: string): Promise<void> {
  emitVisualStep('Navigating', `Going to ${tab || url}`, 'running', url);
  
  return new Promise(resolve => {
    window.dispatchEvent(new CustomEvent('fasto-navigate', { 
      detail: { url, tab } 
    }));
    // Wait for navigation
    setTimeout(() => {
      emitVisualStep('Navigating', `Opened ${tab || url}`, 'success', url);
      resolve();
    }, 500);
  });
}

/**
 * Speak text and wait for speech to complete
 */
export function speakAndWait(text: string): Promise<void> {
  return new Promise(resolve => {
    window.dispatchEvent(new CustomEvent('fasto-speak', { 
      detail: { text, onComplete: resolve } 
    }));
    // Fallback timeout in case speech doesn't fire callback
    setTimeout(resolve, 3000 + text.length * 50);
  });
}

/**
 * Parse natural language date input
 */
export function parseNaturalDate(input: string): string | null {
  const lower = input.toLowerCase().trim();
  const today = new Date();
  
  if (lower === 'today') {
    return formatDateISO(today);
  }
  
  if (lower === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDateISO(tomorrow);
  }
  
  if (lower === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return formatDateISO(yesterday);
  }
  
  // "next monday", "this friday", etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayMatch = lower.match(/(?:next|this)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/);
  if (dayMatch) {
    const targetDay = dayNames.indexOf(dayMatch[1]);
    const currentDay = today.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0 || lower.startsWith('next')) {
      daysToAdd += 7;
    }
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysToAdd);
    return formatDateISO(targetDate);
  }
  
  // Try parsing as a date string
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    return formatDateISO(parsed);
  }
  
  return null;
}

/**
 * Parse natural language time input
 */
export function parseNaturalTime(input: string): { startTime?: string; endTime?: string } | null {
  const lower = input.toLowerCase().trim();
  
  // "7am to 4pm", "7:00 am - 4:00 pm"
  const rangeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (rangeMatch) {
    return {
      startTime: normalizeTime(rangeMatch[1]),
      endTime: normalizeTime(rangeMatch[2])
    };
  }
  
  // Just a single time
  const singleMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
  if (singleMatch) {
    return { startTime: normalizeTime(singleMatch[1]) };
  }
  
  return null;
}

/**
 * Normalize time to 24-hour format (HH:MM)
 */
function normalizeTime(time: string): string {
  const lower = time.toLowerCase().trim();
  const isPM = lower.includes('pm');
  const isAM = lower.includes('am');
  
  const numericPart = lower.replace(/[^0-9:]/g, '');
  let [hours, minutes] = numericPart.split(':').map(Number);
  
  if (isNaN(minutes)) minutes = 0;
  
  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format date to ISO string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Simple delay utility
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if an element is visible and interactive
 */
export function isElementVisible(element: HTMLElement): boolean {
  if (!element) return false;
  
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  );
}

/**
 * Find element by text content
 */
export function findElementByText(
  text: string, 
  tagNames: string[] = ['button', 'a', 'span', 'div', 'p', 'h1', 'h2', 'h3', 'label']
): HTMLElement | null {
  const lowerText = text.toLowerCase();
  
  for (const tag of tagNames) {
    const elements = document.querySelectorAll(tag);
    for (const el of elements) {
      if (el.textContent?.toLowerCase().includes(lowerText) && isElementVisible(el as HTMLElement)) {
        return el as HTMLElement;
      }
    }
  }
  
  return null;
}

/**
 * Find team member by name (fuzzy match)
 */
export function findTeamMemberOption(name: string, options: HTMLElement[]): HTMLElement | null {
  const lowerName = name.toLowerCase();
  
  // Exact match first
  for (const opt of options) {
    if (opt.textContent?.toLowerCase() === lowerName) {
      return opt;
    }
  }
  
  // Partial match
  for (const opt of options) {
    if (opt.textContent?.toLowerCase().includes(lowerName)) {
      return opt;
    }
  }
  
  // First name only match
  const firstName = lowerName.split(' ')[0];
  for (const opt of options) {
    if (opt.textContent?.toLowerCase().includes(firstName)) {
      return opt;
    }
  }
  
  return null;
}
