/**
 * Utility functions for Tremor charts
 */

// Define custom colors for charts
export const chartColors = {
  green: "#0c6b4e",  // dark green (--color-green500)
  teal: "#2a9d8f",   // teal accent
  blue: "#3b82f6",   // blue-500
  purple: "#8b5cf6", // violet-500
  orange: "#f97316", // orange-500
  amber: "#f59e0b",  // amber-500
  red: "#ef4444",    // red-500
  indigo: "#6366f1", // indigo-500
  pink: "#ec4899",   // pink-500
};

// Format number with commas
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format percentage
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

// Format distance in miles with 1 decimal place
export function formatDistance(kilometers: number): string {
  const miles = kilometers * 0.621371;
  return `${Math.round(miles * 10) / 10} mi`;
}

// Format duration from minutes to hours and minutes
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

// Format date for display
export function formatDate(dateString: string): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}
