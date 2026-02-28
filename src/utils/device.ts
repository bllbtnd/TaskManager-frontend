export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobileUserAgent = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);

  return isSmallScreen || isMobileUserAgent;
};
