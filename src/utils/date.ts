/**
 * Format a date object or string into a human-readable format
 * @param date - The date to format
 * @returns A formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
}

/**
 * Format a date as ISO string (YYYY-MM-DD)
 * @param date - The date to format
 * @returns A date string in ISO format
 */
export function formatDateISO(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toISOString().split('T')[0];
}

/**
 * Get a relative time string (e.g., "2 days ago")
 * @param date - The date to format
 * @returns A relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diffInMs = dateObj.getTime() - now.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) {
    return 'Today';
  } else if (diffInDays === 1) {
    return 'Tomorrow';
  } else if (diffInDays === -1) {
    return 'Yesterday';
  } else if (diffInDays > 0 && diffInDays < 30) {
    return rtf.format(diffInDays, 'day');
  } else if (diffInDays < 0 && diffInDays > -30) {
    return rtf.format(diffInDays, 'day');
  } else {
    return formatDate(dateObj);
  }
}
