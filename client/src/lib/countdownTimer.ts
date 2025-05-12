/**
 * Format time difference into HH:MM:SS format
 */
export function formatTimeDifference(endDate: Date): string {
  const now = new Date();
  const endTime = new Date(endDate);
  const diffMs = endTime.getTime() - now.getTime();
  
  // If the auction has ended
  if (diffMs <= 0) {
    return "Ended";
  }
  
  // Calculate hours, minutes, seconds
  const diffSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;
  
  // Format with leading zeros
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Returns true if the auction is ending soon (within 15 minutes)
 */
export function isEndingSoon(endDate: Date): boolean {
  const now = new Date();
  const endTime = new Date(endDate);
  const diffMs = endTime.getTime() - now.getTime();
  
  // Less than 15 minutes
  return diffMs > 0 && diffMs < 15 * 60 * 1000;
}

/**
 * Calculate time elapsed since a given date
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) {
    return interval === 1 ? '1 year ago' : `${interval} years ago`;
  }
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval === 1 ? '1 month ago' : `${interval} months ago`;
  }
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval === 1 ? '1 day ago' : `${interval} days ago`;
  }
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
  }
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
  }
  
  return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
}
