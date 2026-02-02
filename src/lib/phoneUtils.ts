/**
 * Phone number formatting utilities for consistent display and storage
 */

/**
 * Format phone number for display (e.g., (510) 123-4567)
 */
export const formatPhoneDisplay = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle US numbers (10 or 11 digits)
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return original if format doesn't match
  return phone;
};

/**
 * Format phone number for storage (+1XXXXXXXXXX format)
 */
export const formatPhoneForStorage = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle US numbers
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If already has + prefix, return as-is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  // Return original if format doesn't match
  return phone;
};

/**
 * Validate if a phone number is valid
 */
export const isValidPhone = (phone: string | null | undefined): boolean => {
  if (!phone) return false;
  
  const digits = phone.replace(/\D/g, '');
  
  // Valid US numbers are 10 digits or 11 digits starting with 1
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
};

/**
 * Get just the digits from a phone number
 */
export const getPhoneDigits = (phone: string | null | undefined): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};
