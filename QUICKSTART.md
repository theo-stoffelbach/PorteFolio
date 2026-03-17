# 🚀 Guide de Déploiement Rapide

Guide pas à pas pour déployer le portfolio avec authentification sécurisée.

---

## ⏱️ Déploiement en 5 minutes

### Étape 1 : Cloner le projet

```bash
git clone -b V3_PorteFolio https://github.com/theo-stoffelbach/PorteFolio.git
cd PorteFolio
```

### Étape 2 : Configurer l'authentification

**Option A : Avec Docker (recommandé pour production)**

```bash
# 1. Démarrer le container temporairement
docker-compose up -d

# 2. Générer les credentials admin
docker exec -it portfolio npm run create-admin

# 3. Copier les variables affichées dans un nouveau fichier .env
nano .env  # ou vim, code, etc.
# Coller les variables générées par le script

# 4. Redémarrer avec la nouvelle config
docker-compose restart portfolio
```

**Option B : En local (développement)**

```bash
# 1. Installer les dépendances
npm install

# 2. Générer les credentials
npm run create-admin

# 3. Créer le fichier .env
cp .env.example .env
nano .env  # Coller les variables générées

# 4. Lancer en mode dev
npm run dev
```

### Étape 3 : Tester la connexion

1. Ouvrir le portfolio : http://localhost:3000 (ou votre domaine)
2. Aller sur : http://localhost:3000/login
3. Se connecter avec l'email et mot de passe créés
4. Vérifier l'accès au panel admin : http://localhost:3000/admin

✅ **C'est tout ! Le portfolio est sécurisé.**

---

## 📋 Checklist de déploiement

### Avant de déployer en production

- [ ] `.env` créé avec credentials forts
- [ ] `.env` **JAMAIS** commité dans Git
- [ ] HTTPS configuré (certificats SSL valides)
- [ ] Nginx reverse proxy configuré
- [ ] Firewall configuré (ports 80/443 ouverts)
- [ ] Backup de `.env` dans un endroit sûr

### Après le déploiement

- [ ] Tester la connexion admin
- [ ] Vérifier que les routes API sont protégées
- [ ] Vérifier les logs : `docker logs portfolio`
- [ ] Tester les opérations CRUD dans `/admin`

---

## 🔧 Commandes utiles

### Développement

```bash
# Lancer en mode développement
npm run dev

# Build de production
npm run build
npm start

# Générer un nouveau compte admin
npm run create-admin
```

### Production (Docker)

```bash
# Démarrer le portfolio
docker-compose up -d

# Voir les logs
docker logs -f portfolio

# Générer un compte admin
docker exec -it portfolio npm run create-admin

# Redémarrer après changement .env
docker-compose restart portfolio

# Mettre à jour l'image
docker-compose pull
docker-compose up -d

# Arrêter le portfolio
docker-compose down
```

---

## 🌐 Déploiement sur NAS (UGREEN)

### Configuration initiale

```bash
# 1. SSH sur le NAS
ssh Theo@192.168.1.3

# 2. Aller dans le dossier Docker
cd /volume1/Docker_data/portefolio

# 3. Cloner le projet
git clone -b V3_PorteFolio https://github.com/theo-stoffelbach/PorteFolio.git .

# 4. Générer les credentials
docker-compose up -d
docker exec -it portfolio npm run create-admin

# 5. Créer .env avec les variables générées
nano .env

# 6. Redémarrer
docker-compose restart portfolio
```

### Mise à jour automatique (Watchtower)

Le projet utilise Watchtower pour se mettre à jour automatiquement :

```yaml
# Dans docker-compose.yml
watchtower:
  image: containrrr/watchtower
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  environment:
    - WATCHTOWER_POLL_INTERVAL=300  # Vérifie toutes les 5 min
  command: portfolio
```

Workflow :
1. Pusher sur la branche `V3_PorteFolio`
2. GitHub Actions build l'image
3. Image publiée sur GHCR
4. Watchtower détecte et met à jour automatiquement

**Note** : Le fichier `.env` est **préservé** lors des mises à jour (volume persistant).

---

## 🔐 Sécurité : Génération manuelle des credentials

Si vous préférez générer manuellement :

### 1. Hash bcrypt du mot de passe

```bash
# Avec Node.js
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('VotreMotDePasse', 10).then(console.log);"

# Résultat : $2b$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Secret JWT

```bash
# Avec OpenSSL
openssl rand -base64 32

# Résultat : abcd1234efgh5678ijkl9012mnop3456qrst7890uvwx==
```

### 3. Fichier .env

```env
ADMIN_EMAIL=votre@email.com
ADMIN_PASSWORD_HASH=$2b$10$xxxxxxxxxxx...
JWT_SECRET=abcd1234efgh5678...
JWT_EXPIRES_IN=604800
NODE_ENV=production
```

---

## 🐛 Dépannage rapide

### Problème : "Erreur de configuration du serveur"

```bash
# Vérifier que les variables sont chargées
docker exec portfolio printenv | grep ADMIN

# Si vide, vérifier que .env existe
ls -la .env

# Redémarrer le container
docker-compose restart portfolio
```

### Problème : "Email ou mot de passe incorrect"

```bash
# Vérifier l'email configuré
docker exec portfolio printenv ADMIN_EMAIL

# Régénérer un nouveau compte
docker exec -it portfolio npm run create-admin
# Mettre à jour .env
# Redémarrer
```

### Problème : Routes API toujours accessibles sans auth

```bash
# Vérifier que le middleware est bien déployé
docker exec portfolio ls -la /app/middleware.ts

# Vérifier les logs du middleware
docker logs portfolio | grep middleware

# Tester une route protégée
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title":"Test"}'
# Devrait retourner 401 Unauthorized
```

---

## 📚 Documentation complète

Pour aller plus loin :
- **[SECURITY.md](SECURITY.md)** - Documentation complète de sécurité
- **[README.md](README.md)** - Documentation générale du projet
- **[DEPLOY.md](DEPLOY.md)** - Guide de déploiement détaillé

---

## 💡 Conseils pro

### Performance

- Utiliser Redis pour le cache des sessions (futur)
- Configurer un CDN pour les assets statiques
- Activer la compression Gzip dans Nginx

### Monitoring

```bash
# Surveiller les tentatives de connexion échouées
docker logs portfolio | grep "incorrect" | tail -20

# Alertes sur Docker health check
docker inspect portfolio | grep Health -A 10
```

### Backup

```bash
# Sauvegarder .env (IMPORTANT)
cp .env .env.backup.$(date +%Y%m%d)

# Sauvegarder les données
tar -czf data-backup-$(date +%Y%m%d).tar.gz data/
```

---

**Dernière mise à jour** : 28 novembre 2024
**Auteur** : Théo Stoffelbach
