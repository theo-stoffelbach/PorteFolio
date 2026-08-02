const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
export const LOGIN_RATE_LIMIT_MAX_BUCKETS = 5000;

interface LoginBucket {
  count: number;
  resetAt: number;
}

export interface LoginRateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
}

// Le déploiement Compose exécute un seul processus. Ce compteur est donc
// volontairement local et repart à zéro au redémarrage. Utiliser un stockage
// atomique partagé (Redis, par exemple) avant d'ajouter des replicas.
const buckets = new Map<string, LoginBucket>();

function cleanupExpiredBuckets(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function getLoginClientKey(headers: Headers): string {
  // Frontière de confiance du déploiement : le conteneur n'a aucun port
  // publié et NPM remplace X-Real-IP par $remote_addr avant de transmettre
  // la requête. Ne pas exposer directement l'application sans adapter ceci.
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 128);

  const forwardedFor = headers.get('x-forwarded-for');
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim();
  if (firstForwardedIp) return firstForwardedIp.slice(0, 128);

  return 'unknown-client';
}

export function consumeLoginAttempt(
  clientKey: string,
  now = Date.now()
): LoginRateLimitResult {
  cleanupExpiredBuckets(now);

  const existing = buckets.get(clientKey);
  if (!existing && buckets.size >= LOGIN_RATE_LIMIT_MAX_BUCKETS) {
    // Ne jamais évincer un bucket actif : une rafale de nouvelles clés ne doit
    // pas pouvoir remettre à zéro le quota d'un attaquant déjà bloqué.
    let resetAt = now + LOGIN_WINDOW_MS;
    for (const bucket of buckets.values()) {
      resetAt = Math.min(resetAt, bucket.resetAt);
    }
    return {
      allowed: false,
      limit: LOGIN_MAX_ATTEMPTS,
      remaining: 0,
      resetAt,
      retryAfter: Math.max(1, Math.ceil((resetAt - now) / 1000)),
    };
  }
  const bucket =
    existing && existing.resetAt > now
      ? existing
      : { count: 0, resetAt: now + LOGIN_WINDOW_MS };

  if (bucket.count >= LOGIN_MAX_ATTEMPTS) {
    buckets.set(clientKey, bucket);
    return {
      allowed: false,
      limit: LOGIN_MAX_ATTEMPTS,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  buckets.set(clientKey, bucket);

  return {
    allowed: true,
    limit: LOGIN_MAX_ATTEMPTS,
    remaining: Math.max(0, LOGIN_MAX_ATTEMPTS - bucket.count),
    resetAt: bucket.resetAt,
    retryAfter: 0,
  };
}

export function clearLoginAttempts(clientKey: string): void {
  buckets.delete(clientKey);
}
