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

function evictLeastRiskyBucket(): void {
  let candidateKey: string | undefined;
  let candidateCount = Number.POSITIVE_INFINITY;

  // Préserver en priorité les IP proches du blocage. À nombre d'essais égal,
  // l'ordre d'insertion de Map sélectionne la plus ancienne (FIFO).
  for (const [key, bucket] of buckets) {
    if (bucket.count < candidateCount) {
      candidateKey = key;
      candidateCount = bucket.count;
    }
  }

  if (candidateKey) buckets.delete(candidateKey);
}

export function getLoginClientKey(headers: Headers): string {
  // Frontière de confiance du déploiement : le conteneur n'a aucun port
  // publié et NPM remplace X-Real-IP par $remote_addr avant de transmettre
  // la requête. Ne pas exposer directement l'application sans adapter ceci.
  const realIp = headers.get('x-real-ip')?.trim();
  if (realIp) return realIp.slice(0, 128);

  // X-Forwarded-For peut contenir une valeur fournie par le client. Sans
  // X-Real-IP réécrit par NPM, partager un bucket est plus sûr que permettre
  // la rotation arbitraire des clés.
  return 'unknown-client';
}

export function consumeLoginAttempt(
  clientKey: string,
  now = Date.now()
): LoginRateLimitResult {
  cleanupExpiredBuckets(now);

  const existing = buckets.get(clientKey);
  if (!existing && buckets.size >= LOGIN_RATE_LIMIT_MAX_BUCKETS) {
    evictLeastRiskyBucket();
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
