/**
 * Utilitaires d'authentification
 *
 * Fournit les fonctions pour :
 * - Vérifier les mots de passe avec bcrypt
 * - Générer des tokens JWT
 * - Vérifier les tokens JWT
 * - Protéger les routes API
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// Configuration depuis les variables d'environnement
const JWT_EXPIRES_IN = parseInt(process.env.JWT_EXPIRES_IN || '604800'); // 7 jours par défaut

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL: JWT_SECRET doit être défini dans les variables d\'environnement.');
  }
  return secret;
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
 */
export function generateToken(email: string): string {
  const payload: JWTPayload = {
    email,
  };

  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Vérifie et décode un token JWT
 * Retourne null si le token est invalide ou expiré
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token invalide:', error);
    return null;
  }
}

/**
 * Extrait et vérifie le token depuis une requête Next.js
 * Retourne le payload du token si valide, null sinon
 */
export function getTokenFromRequest(request: NextRequest): JWTPayload | null {
  const token = request.cookies.get('admin_token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Vérifie si une requête est authentifiée
 */
export function isAuthenticated(request: NextRequest): boolean {
  const tokenPayload = getTokenFromRequest(request);
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
