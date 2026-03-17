# 🚀 Guide de déploiement - Portfolio sécurisé

**Date**: 28 novembre 2024
**Auteur**: Claude Code + Theo Stoffelbach

---

## ✅ Ce qui a été fait

### 1. Amélioration de la sécurité

- ✅ **Authentification bcrypt** : Hash sécurisé des mots de passe (10 rounds)
- ✅ **Tokens JWT** : Authentification stateless avec signature
- ✅ **Protection des routes API** : POST/PUT/DELETE nécessitent authentification
- ✅ **Variables d'environnement** : Credentials configurables via .env
- ✅ **Script de génération** : `create-admin.js` pour générer les credentials
- ✅ **Documentation complète** : SECURITY.md + QUICKSTART.md

### 2. Fichiers créés

```
source_code/
├── .env.example                    # Template de configuration
├── lib/auth.ts                     # Utilitaires bcrypt + JWT
├── scripts/create-admin.js         # Générateur de credentials
├── SECURITY.md                     # Documentation sécurité
├── QUICKSTART.md                   # Guide déploiement rapide
└── middleware.ts                   # Protection des routes (modifié)
```

### 3. Fichiers modifiés

```
- package.json                      # + bcryptjs, jsonwebtoken
- app/api/auth/login/route.ts       # Authentification JWT
- docker-compose.yml                # Support .env
- README.md                         # Section sécurité
```

### 4. Commit Git

✅ Commit créé localement :
```
commit 42db924
feat: Add secure authentication with bcrypt + JWT
```

⚠️ **RESTE À FAIRE**: Push vers GitHub (nécessite vos credentials Git)

---

## 🔐 Credentials de test générés

Un compte de test a été créé dans `/volume1/Docker_data/portefolio/.env`:

```
Email: admin@portfolio.com
Password: TestAdmin123!
```

⚠️ **IMPORTANT**: Changez ces credentials en production avec :
```bash
docker exec -it portfolio npm run create-admin
```

---

## 📋 Prochaines étapes pour déployer

### Étape 1 : Pusher le code sur GitHub

```bash
cd /volume1/Docker_data/portefolio

# Option A : SSH (si configuré)
git remote set-url origin git@github.com:theo-stoffelbach/PorteFolio.git
git push origin V3_PorteFolio

# Option B : HTTPS avec Personal Access Token
# 1. Créer un token sur GitHub : Settings > Developer Settings > Personal Access Tokens
# 2. Puis :
git config --global credential.helper store
git push origin V3_PorteFolio
# Entrer username + token quand demandé
```

### Étape 2 : Attendre le build GitHub Actions

Une fois pushé, GitHub Actions va :
1. Builder l'image Docker avec le nouveau code
2. La publier sur `ghcr.io/theo-stoffelbach/portefolio:latest`
3. Watchtower va détecter la nouvelle image (toutes les 5 min)
4. Le portfolio sera automatiquement mis à jour

**Temps estimé** : 5-10 minutes après le push

### Étape 3 : Vérifier le déploiement

```bash
# Voir les logs du container
docker logs -f portfolio

# Vérifier que les variables d'environnement sont chargées
docker exec portfolio printenv | grep ADMIN

# Vérifier le healthcheck
docker inspect portfolio | grep Health -A 10
```

### Étape 4 : Tester l'authentification

1. **Aller sur la page de login** :
   https://votre-domaine.fr/login (ou http://localhost:3000/login)

2. **Se connecter avec** :
   - Email: `admin@portfolio.com`
   - Password: `TestAdmin123!`

3. **Vérifier l'accès admin** :
   https://votre-domaine.fr/admin

4. **Tester la protection des routes API** :
   ```bash
   # Sans authentification → Devrait retourner 401
   curl -X POST https://votre-domaine.fr/api/projects \
     -H "Content-Type: application/json" \
     -d '{"title":"Test"}'

   # Résultat attendu : {"message":"Non autorisé - Authentification requise"}
   ```

---

## 🔧 Commandes utiles

### Générer un nouveau compte admin

```bash
docker exec -it portfolio npm run create-admin
```

Puis mettre à jour `.env` et redémarrer :
```bash
nano /volume1/Docker_data/portefolio/.env
docker restart portfolio
```

### Voir les logs

```bash
# Logs en temps réel
docker logs -f portfolio

# Logs d'authentification
docker logs portfolio | grep -i "connexion\|auth\|login"

# Logs d'erreurs
docker logs portfolio | grep -i "error\|erreur"
```

### Debugger

```bash
# Vérifier que le container est en bonne santé
docker ps | grep portfolio

# Inspecter la configuration
docker inspect portfolio

# Tester une route depuis le container
docker exec portfolio curl -s http://localhost:3000/api/projects
```

---

## ⚠️ Important à savoir

### Différence entre les dossiers

1. **/volume1/Docker_data/portefolio/**
   - Dossier de déploiement actuel
   - Contient l'ancien code
   - `docker-compose.yml` mis à jour
   - `.env` créé

2. **/volume1/Docker_data/portefolio/source_code/**
   - Code source cloné depuis GitHub (branche V3_PorteFolio)
   - Contient tous les nouveaux fichiers
   - Commit prêt à être pushé
   - **C'est ce dossier qui doit être pushé sur GitHub**

### Workflow de mise à jour

```
1. Modifier le code dans source_code/
2. git commit + git push (dans source_code/)
3. GitHub Actions build l'image
4. Watchtower met à jour automatiquement le container
5. Le .env est préservé (volume persistant)
```

### Fichiers sensibles

❌ **NE JAMAIS commiter** :
- `.env` (déjà ignoré par .gitignore)
- `node_modules/`
- `.next/`

✅ **À commiter** :
- `.env.example` (template sans vraies valeurs)
- Tout le code source

---

## 🐛 Dépannage

### Problème : "Erreur de configuration du serveur"

**Cause** : Variables d'environnement manquantes

**Solution** :
```bash
# Vérifier .env existe
cat /volume1/Docker_data/portefolio/.env

# Vérifier les variables sont chargées
docker exec portfolio printenv | grep ADMIN

# Redémarrer le container
docker restart portfolio
```

### Problème : "Email ou mot de passe incorrect"

**Solution** :
```bash
# Vérifier l'email configuré
docker exec portfolio printenv ADMIN_EMAIL

# Régénérer les credentials
docker exec -it portfolio npm run create-admin
# Mettre à jour .env
# Redémarrer
```

### Problème : Routes API toujours accessibles sans auth

**Cause** : L'image Docker n'a pas encore été mise à jour

**Solution** :
1. Attendre que vous pushez sur GitHub
2. Attendre le build GitHub Actions
3. Attendre que Watchtower mette à jour (5-10 min)
4. Ou forcer le pull : `docker compose pull && docker compose up -d`

---

## 📊 Récapitulatif du système de sécurité

### Avant (ancien système)

```
❌ Mot de passe en clair : "admin123"
❌ Token base64 simple : non sécurisé
❌ Routes API publiques : tout le monde peut modifier
❌ Credentials hard-codés : impossible à changer
```

### Après (nouveau système)

```
✅ Hash bcrypt : $2b$10$LMGQ5pwwmB1h53P920cgBOd4iziYenOaXOmR5MF1oz87wUvXxl.b6
✅ JWT signé : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Routes protégées : POST/PUT/DELETE nécessitent authentification
✅ Variables .env : changement facile et sécurisé
✅ Script create-admin : génération automatique
```

### Architecture

```
┌─────────────────────────────────────────────┐
│           Page /login                       │
│  Email + Password                           │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│     POST /api/auth/login                    │
│  1. Vérifier email                          │
│  2. bcrypt.compare(password, hash)          │
│  3. jwt.sign(payload, secret)               │
│  4. Set cookie HttpOnly                     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         Middleware (toutes requêtes)        │
│  1. Extraire cookie admin_token             │
│  2. jwt.verify(token, secret)               │
│  3. Si invalide → 401 Unauthorized          │
│  4. Si valide → next()                      │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│      Routes protégées accessibles           │
│  /admin → OK                                │
│  POST /api/projects → OK                    │
│  PUT /api/experiences → OK                  │
│  DELETE /api/formations → OK                │
└─────────────────────────────────────────────┘
```

---

## 📞 Support

En cas de problème :

1. Consulter **SECURITY.md** dans `source_code/`
2. Consulter **QUICKSTART.md** dans `source_code/`
3. Vérifier les logs : `docker logs portfolio`
4. Contact : theo.stoffelbach@hotmail.com

---

**Bon déploiement ! 🚀**
