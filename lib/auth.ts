/**
 * Utilitaires d'authentification côté serveur.
 *
 * La logique JWT compatible middleware vit dans `lib/jwt.ts` afin que le
 * bundle Edge n'importe jamais bcrypt.
 */

import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  verifyToken,
  type JWTPayload,
} from '@/lib/jwt';

export {
  ADMIN_COOKIE_NAME,
  assertJwtConfiguration,
  generateToken,
  getJwtExpiresIn,
  verifyToken,
  type JWTPayload,
} from '@/lib/jwt';

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function getTokenFromRequest(
  request: NextRequest
): Promise<JWTPayload | null> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  return token ? verifyToken(token) : null;
}

export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  return (await getTokenFromRequest(request)) !== null;
}

export function getAdminCredentials(): {
  email: string;
  passwordHash: string;
} {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!email || !passwordHash) {
    throw new Error(
      'ADMIN_EMAIL et ADMIN_PASSWORD_HASH doivent être configurés. ' +
        'Utilisez "npm run create-admin" pour générer un compte.'
    );
  }

  return { email, passwordHash };
}
