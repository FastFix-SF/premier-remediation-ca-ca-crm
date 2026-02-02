// Utility functions for Pacific Time (Los Angeles) formatting
// All times are based on San Francisco / America/Los_Angeles timezone
// Automatically handles PST (-08:00) and PDT (-07:00) transitions

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

/**
 * Get the current Pacific Time offset accounting for DST
 * Returns the offset string for date construction (e.g., "-08:00" or "-07:00")
 */
const getPacificOffset = (date: Date = new Date()): string => {
  // Use Intl to get the actual offset for the given date in Pacific timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PACIFIC_TIMEZONE,
    timeZoneName: 'longOffset'
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find(p => p.type === 'timeZoneName');
  // offsetPart.value will be like "GMT-08:00" or "GMT-07:00"
  if (offsetPart?.value) {
    const match = offsetPart.value.match(/GMT([+-]\d{2}:\d{2})/);
    if (match) {
      return match[1]; // Returns "-08:00" or "-07:00"
    }
  }
  // Fallback: calculate based on actual offset
  const testDate = new Date(date.toLocaleString('en-US', { timeZone: PACIFIC_TIMEZONE }));
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const diffHours = Math.round((utcDate.getTime() - testDate.getTime()) / (1000 * 60 * 60));
  return diffHours >= 0 ? `-0${diffHours}:00` : `+0${Math.abs(diffHours)}:00`;
};

/**
 * Format a date/time in Pacific Time
 */
export const formatTimePacific = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: PACIFIC_TIMEZONE,
  };
  
  return dateObj.toLocaleTimeString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format a date in Pacific Time
 */
export const formatDatePacific = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: PACIFIC_TIMEZONE,
  };
  
  return dateObj.toLocaleDateString('en-US', { ...defaultOptions, ...options });
};

/**
 * Format date and time in Pacific Time
 */
export const formatDateTimePacific = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: PACIFIC_TIMEZONE,
  });
};

/**
 * Get the start of today in Pacific Time (as UTC ISO string for DB queries)
 */
export const getTodayStartPacific = (): string => {
  const now = new Date();
  // Format today's date in Pacific timezone
  const pacificDate = now.toLocaleDateString('en-CA', { timeZone: PACIFIC_TIMEZONE });
  // Create a date at midnight Pacific time with correct DST offset
  const offset = getPacificOffset(now);
  const pacificMidnight = new Date(`${pacificDate}T00:00:00${offset}`);
  return pacificMidnight.toISOString();
};

/**
 * Get the end of today in Pacific Time (as UTC ISO string for DB queries)
 */
export const getTodayEndPacific = (): string => {
  const now = new Date();
  const pacificDate = now.toLocaleDateString('en-CA', { timeZone: PACIFIC_TIMEZONE });
  const offset = getPacificOffset(now);
  const pacificEndOfDay = new Date(`${pacificDate}T23:59:59${offset}`);
  return pacificEndOfDay.toISOString();
};

/**
 * Check if a date is from a previous day in Pacific Time
 */
export const isPreviousDayPacific = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Get date strings in Pacific timezone
  const inputDate = dateObj.toLocaleDateString('en-CA', { timeZone: PACIFIC_TIMEZONE });
  const todayDate = now.toLocaleDateString('en-CA', { timeZone: PACIFIC_TIMEZONE });
  
  return inputDate < todayDate;
};

/**
 * Get end of day (11:59 PM) for a given date in Pacific Time
 */
export const getEndOfDayPacific = (date: Date | string): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const pacificDate = dateObj.toLocaleDateString('en-CA', { timeZone: PACIFIC_TIMEZONE });
  const offset = getPacificOffset(dateObj);
  return new Date(`${pacificDate}T23:59:00${offset}`);
};

/**
 * Convert a 24-hour time string (HH:mm or HH:mm:ss) to 12-hour format with AM/PM
 */
export const formatTime12Hour = (timeString: string): string => {
  if (!timeString || timeString === '-') return '-';
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  if (isNaN(hour)) return timeString;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

/**
 * Get today's date as YYYY-MM-DD string in Pacific Time
 */
export const getTodayDateStringPacific = (): string => {
  return new Date().toLocaleDateString('en-CA', { timeZone: PACIFIC_TIMEZONE });
};

/**
 * Get a date as YYYY-MM-DD string in Pacific Time
 */
export const getDateStringPacific = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-CA', { timeZone: PACIFIC_TIMEZONE });
};

/**
 * Check if two dates are the same day in Pacific Time
 */
export const isSameDayPacific = (date1: Date | string, date2: Date | string): boolean => {
  return getDateStringPacific(date1) === getDateStringPacific(date2);
};

/**
 * Check if a date is today in Pacific Time
 */
export const isTodayPacific = (date: Date | string): boolean => {
  return getDateStringPacific(date) === getTodayDateStringPacific();
};

/**
 * Get current time in Pacific Time as a Date object
 * Useful for comparisons that need to be in Pacific Time context
 */
export const getNowPacific = (): Date => {
  const now = new Date();
  const pacificStr = now.toLocaleString('en-US', { timeZone: PACIFIC_TIMEZONE });
  return new Date(pacificStr);
};
