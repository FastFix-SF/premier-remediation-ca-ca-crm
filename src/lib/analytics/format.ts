export const formatNumber = (n: number): string => {
  return n.toLocaleString('en-US');
};

export const formatPercent = (p: number, decimals: number = 0): string => {
  return `${(p * 100).toFixed(decimals)}%`;
};

export const formatDuration = (seconds: number): string => {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
};

export const formatViews = (views: number): string => {
  if (views === 0) return '0';
  if (views === 1) return '1';
  return views.toFixed(2);
};