import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

const DEFAULT_MAX_JSON_BYTES = 64 * 1024;

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function getExpectedOrigins(request: NextRequest): Set<string> {
  const origins = new Set<string>();
  const configuredOrigin = process.env.NEXT_PUBLIC_BASE_URL;

  if (configuredOrigin) {
    const normalizedConfiguredOrigin = normalizeOrigin(configuredOrigin);
    if (normalizedConfiguredOrigin) {
      origins.add(normalizedConfiguredOrigin);
    }
  }

  // NPM réécrit Host et X-Forwarded-Proto. X-Forwarded-Host peut provenir du
  // client : ne jamais l'utiliser pour construire une origine de confiance.
  const requestHost =
    request.headers.get('host')?.trim() || request.nextUrl.host;
  const forwardedProto =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
    request.nextUrl.protocol.replace(':', '');

  if (requestHost && (forwardedProto === 'https' || forwardedProto === 'http')) {
    const requestOrigin = normalizeOrigin(`${forwardedProto}://${requestHost}`);
    if (requestOrigin) {
      origins.add(requestOrigin);
    }
  }

  origins.add(request.nextUrl.origin);
  return origins;
}

export function isTrustedMutationOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');

  if (!origin) {
    return request.headers.get('sec-fetch-site') === 'same-origin';
  }

  const normalizedOrigin = normalizeOrigin(origin);
  return normalizedOrigin !== null && getExpectedOrigins(request).has(normalizedOrigin);
}

export async function enforceAdminMutation(
  request: NextRequest
): Promise<NextResponse | null> {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json(
      { error: 'Non autorisé' },
      {
        status: 401,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  if (!isTrustedMutationOrigin(request)) {
    return NextResponse.json(
      { error: 'Origine de la requête refusée' },
      {
        status: 403,
        headers: { 'Cache-Control': 'no-store' },
      }
    );
  }

  return null;
}

export async function readJsonBody(
  request: NextRequest,
  maxBytes = DEFAULT_MAX_JSON_BYTES
): Promise<unknown> {
  const contentType = request.headers.get('content-type')?.toLowerCase() || '';
  const mediaType = contentType.split(';', 1)[0]?.trim();
  if (mediaType !== 'application/json') {
    throw new ApiRequestError('Content-Type application/json requis', 415);
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    if (!/^\d+$/.test(contentLength)) {
      throw new ApiRequestError('Content-Length invalide', 400);
    }
    const parsedLength = Number(contentLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new ApiRequestError('Content-Length invalide', 400);
    }
    if (parsedLength > maxBytes) {
      throw new ApiRequestError('Corps de requête trop volumineux', 413);
    }
  }

  if (!request.body) {
    throw new ApiRequestError('Corps JSON requis', 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new ApiRequestError('Corps de requête trop volumineux', 413);
    }
    chunks.push(value);
  }

  if (totalBytes === 0) {
    throw new ApiRequestError('Corps JSON requis', 400);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder().decode(body));
  } catch {
    throw new ApiRequestError('JSON invalide', 400);
  }
}

export function apiErrorResponse(
  error: unknown,
  fallbackMessage: string,
  extraHeaders: HeadersInit = {}
): NextResponse {
  const headers = new Headers(extraHeaders);
  headers.set('Cache-Control', 'no-store');

  if (error instanceof ApiRequestError) {
    return NextResponse.json(
      { error: error.message },
      {
        status: error.status,
        headers,
      }
    );
  }

  console.error(fallbackMessage, error);
  return NextResponse.json(
    { error: fallbackMessage },
    {
      status: 500,
      headers,
    }
  );
}
