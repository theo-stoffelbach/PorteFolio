#!/usr/bin/env node

/**
 * Script de génération de compte administrateur
 *
 * Usage:
 *   npm run create-admin
 *
 * Ce script permet de générer un hash bcrypt sécurisé pour le mot de passe admin
 */

import readline from 'readline';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function generateAdminCredentials() {
  console.log('\n========================================');
  console.log('🔐 GÉNÉRATEUR DE COMPTE ADMINISTRATEUR');
  console.log('========================================\n');

  try {
    // Demander l'email
    const email = await question('📧 Email admin: ');

    if (!email || !email.includes('@')) {
      console.error('❌ Email invalide');
      rl.close();
      process.exit(1);
    }

    // Demander le mot de passe
    const password = await question('🔑 Mot de passe: ');

    if (!password || password.length < 8) {
      console.error('❌ Le mot de passe doit contenir au moins 8 caractères');
      rl.close();
      process.exit(1);
    }

    // Confirmer le mot de passe
    const confirmPassword = await question('🔑 Confirmez le mot de passe: ');

    if (password !== confirmPassword) {
      console.error('❌ Les mots de passe ne correspondent pas');
      rl.close();
      process.exit(1);
    }

    console.log('\n⏳ Génération du hash bcrypt (cela peut prendre quelques secondes)...\n');

    // Générer le hash bcrypt (10 rounds = bon équilibre sécurité/performance)
    const passwordHash = await bcrypt.hash(password, 10);

    // Générer un secret JWT aléatoire fort
    const jwtSecret = randomBytes(32).toString('base64');

    console.log('✅ Génération terminée !\n');
    console.log('========================================');
    console.log('📋 VARIABLES D\'ENVIRONNEMENT À CONFIGURER');
    console.log('========================================\n');
    console.log('Ajoutez ces variables dans votre fichier .env :\n');

    console.log('# Configuration Admin');
    console.log(`ADMIN_EMAIL=${email}`);
    console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
    console.log('');
    console.log('# JWT Secret (généré aléatoirement)');
    console.log(`JWT_SECRET=${jwtSecret}`);
    console.log('');
    console.log('# Durée de validité du token JWT (7 jours par défaut)');
    console.log('JWT_EXPIRES_IN=604800');
    console.log('');
    console.log('========================================\n');
    console.log('⚠️  SÉCURITÉ :');
    console.log('   1. Ne JAMAIS commiter le fichier .env dans Git');
    console.log('   2. Gardez JWT_SECRET secret et unique par environnement');
    console.log('   3. Changez régulièrement vos mots de passe');
    console.log('   4. Utilisez des mots de passe forts (12+ caractères)\n');
    console.log('========================================\n');

    rl.close();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    rl.close();
    process.exit(1);
  }
}

generateAdminCredentials();
