import { SignJWT, jwtVerify } from 'jose';

export const ADMIN_COOKIE_NAME = 'admin_token';

const JWT_ISSUER = 'portefolio-admin';
const JWT_AUDIENCE = 'portefolio-admin-ui';
const DEFAULT_JWT_EXPIRES_IN = 604800;
const MIN_JWT_EXPIRES_IN = 300;
const MAX_JWT_EXPIRES_IN = 604800;

export interface JWTPayload {
  email: string;
  iat?: number;
  exp?: number;
}

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      'FATAL: JWT_SECRET doit être défini et contenir au moins 32 octets.'
    );
  }
  return new TextEncoder().encode(secret);
}

function getAdminEmail(): string {
  const email = process.env.ADMIN_EMAIL;
  if (!email) {
    throw new Error('ADMIN_EMAIL doit être configuré.');
  }
  return email;
}

export function getJwtExpiresIn(): number {
  const configuredValue =
    process.env.JWT_EXPIRES_IN || String(DEFAULT_JWT_EXPIRES_IN);
  const value = /^\d+$/.test(configuredValue)
    ? Number(configuredValue)
    : Number.NaN;

  if (
    !Number.isSafeInteger(value) ||
    value < MIN_JWT_EXPIRES_IN ||
    value > MAX_JWT_EXPIRES_IN
  ) {
    throw new Error(
      `JWT_EXPIRES_IN doit être compris entre ${MIN_JWT_EXPIRES_IN} et ${MAX_JWT_EXPIRES_IN} secondes.`
    );
  }

  return value;
}

export function assertJwtConfiguration(): void {
  getJwtSecret();
  getJwtExpiresIn();
  getAdminEmail();
}

export async function generateToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + getJwtExpiresIn())
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    if (payload.email !== getAdminEmail()) return null;
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
