export function buildContentSecurityPolicy(isProduction: boolean): string {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "object-src 'none'",
    isProduction
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    isProduction ? "connect-src 'self'" : "connect-src 'self' ws: wss:",
    "media-src 'self'",
    ...(isProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}
