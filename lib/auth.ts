/**
 * Utilitaires d'authentification
 *
 * Fournit les fonctions pour :
 * - Vérifier les mots de passe avec bcrypt
 * - Générer des tokens JWT (compatible Edge Runtime avec jose)
 * - Vérifier les tokens JWT
 * - Protéger les routes API
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

export const ADMIN_COOKIE_NAME = 'admin_token';

const JWT_ISSUER = 'portefolio-admin';
const JWT_AUDIENCE = 'portefolio-admin-ui';
const DEFAULT_JWT_EXPIRES_IN = 604800;
const MIN_JWT_EXPIRES_IN = 300;
const MAX_JWT_EXPIRES_IN = 604800;

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error(
      'FATAL: JWT_SECRET doit être défini et contenir au moins 32 octets.'
    );
  }
  return new TextEncoder().encode(secret);
}

export function getJwtExpiresIn(): number {
  const value = Number.parseInt(
    process.env.JWT_EXPIRES_IN || String(DEFAULT_JWT_EXPIRES_IN),
    10
  );

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

export interface JWTPayload {
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Vérifie si le mot de passe correspond au hash stocké
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Erreur lors de la vérification du mot de passe:', error);
    return false;
  }
}

/**
 * Génère un hash bcrypt pour un mot de passe
 * Utile pour les migrations ou tests
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Génère un token JWT pour l'utilisateur authentifié
 * Utilise jose pour la compatibilité Edge Runtime
 */
export async function generateToken(email: string): Promise<string> {
  const expiresIn = getJwtExpiresIn();

  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(getJwtSecret());

  return token;
}

/**
 * Vérifie et décode un token JWT
 * Retourne null si le token est invalide ou expiré
 * Compatible Edge Runtime avec jose
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });

    const { email } = getAdminCredentials();
    if (payload.email !== email) {
      return null;
    }

    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Extrait et vérifie le token depuis une requête Next.js
 * Retourne le payload du token si valide, null sinon
 */
export async function getTokenFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Vérifie si une requête est authentifiée
 */
export async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const tokenPayload = await getTokenFromRequest(request);
  return tokenPayload !== null;
}

/**
 * Récupère les credentials admin depuis les variables d'environnement
 * Lance une erreur si les variables ne sont pas configurées en production
 */
export function getAdminCredentials(): { email: string; passwordHash: string } {
  const email = process.env.ADMIN_EMAIL;
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  // Toujours exiger des credentials configurés
  if (!email || !passwordHash) {
    throw new Error(
      'ADMIN_EMAIL et ADMIN_PASSWORD_HASH doivent être configurés. ' +
      'Utilisez "npm run create-admin" pour générer un compte.'
    );
  }

  return { email, passwordHash };
}
