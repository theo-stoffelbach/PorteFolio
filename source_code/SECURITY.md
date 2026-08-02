# 🔐 Sécurité et Authentification

Ce document décrit le système d'authentification du portfolio et comment le configurer de manière sécurisée.

---

## 🎯 Vue d'ensemble

Le portfolio utilise un système d'authentification sécurisé basé sur :

- **bcrypt** : Hashage sécurisé des mots de passe (10 rounds)
- **JWT (JSON Web Tokens)** : Authentification stateless avec tokens signés
- **Cookies HttpOnly** : Stockage sécurisé des tokens (protection XSS)
- **Middleware Next.js** : Protection automatique des routes sensibles

### Routes protégées

#### Pages
- `/admin/*` - Panel d'administration (redirection vers /login si non authentifié)

#### API (POST/PUT/DELETE uniquement)
- `/api/projects` - Gestion des projets
- `/api/experiences` - Gestion des expériences
- `/api/formations` - Gestion des formations

Les routes **GET** restent publiques pour permettre l'affichage du portfolio.

La limitation de connexion (5 essais sur 15 minutes) est stockée en mémoire et
convient au déploiement Compose actuel à une seule instance. Elle repart à zéro
au redémarrage. Avant tout passage à plusieurs replicas, remplacez-la par un
compteur partagé atomique (Redis, par exemple) ou une limite commune dans le
reverse proxy.

---

## 🚀 Configuration initiale

### 1. Générer un compte administrateur

Le projet inclut un script interactif pour générer vos credentials :

```bash
# Depuis le checkout du projet (développement ou NAS)
npm run create-admin
```

L'image de production ne contient volontairement ni npm ni le script afin de
réduire sa surface d'attaque. Générez les valeurs depuis le checkout, copiez-les
dans `../.env.runtime`, puis redémarrez le conteneur.

Le script vous demandera :
- 📧 **Email admin** : votre adresse email
- 🔑 **Mot de passe** : minimum 8 caractères
- 🔑 **Confirmation** : re-saisie pour sécurité

Il générera automatiquement :
- Hash bcrypt du mot de passe
- Secret JWT aléatoire fort
- Configuration complète à copier dans `../.env.runtime`

### 2. Créer le fichier `../.env.runtime`

Le Compose de `source_code` charge explicitement `../.env.runtime`. Créez ce
fichier à partir de l'exemple, puis limitez immédiatement ses permissions :

```bash
cp .env.example ../.env.runtime
chmod 600 ../.env.runtime
```

Puis remplacez les valeurs par celles générées par le script `create-admin` :

```env
# Configuration Admin
ADMIN_EMAIL=votre@email.com
ADMIN_PASSWORD_HASH=$2b$10$...votre_hash_bcrypt...

# JWT Secret (TRÈS IMPORTANT - unique, secret et 32 octets minimum)
JWT_SECRET=votre_secret_jwt_aleatoire_genere

# Durée de validité du token (en secondes)
JWT_EXPIRES_IN=604800  # 7 jours par défaut

# Environnement
NODE_ENV=production
```

> **Migration :** une ancienne version de cette documentation proposait
> `2592000` (30 jours). Cette valeur n'est plus acceptée : avant déploiement,
> ramenez `JWT_EXPIRES_IN` entre 300 et 604800 secondes. Une configuration hors
> limites est journalisée et le login répond par une erreur de configuration.

### 3. Déployer avec Docker

```bash
# Sur votre NAS ou serveur
cd /volume2/docker/portefolio/source_code

# Vérifier l'existence et les permissions sans afficher les secrets
test -s ../.env.runtime
stat -c '%a %n' ../.env.runtime  # attendu : 600 ../.env.runtime

# Créer une seule fois la façade partagée avec Nginx Proxy Manager
docker network create portfolio_public

# Redémarrer le container pour charger les nouvelles variables
docker-compose down
docker-compose pull  # Mettre à jour l'image
docker-compose up -d
```

---

## 🔒 Bonnes pratiques de sécurité

### ✅ À FAIRE

1. **Générer des credentials forts**
   - Email : une adresse email réelle que vous contrôlez
   - Mot de passe : minimum 12 caractères, complexe
   - JWT_SECRET : généré automatiquement (32 bytes aléatoires)

2. **Protéger le fichier `../.env.runtime`**
   ```bash
   # Permissions restrictives (uniquement propriétaire)
   chmod 600 ../.env.runtime

   # Vérifier qu'il est ignoré par Git
   git check-ignore ../.env.runtime  # Doit retourner "../.env.runtime"
   ```

3. **Changer régulièrement**
   - Mot de passe admin : tous les 3-6 mois
   - JWT_SECRET : si compromis ou migration serveur

4. **Surveiller les logs**
   ```bash
   # Vérifier les tentatives de connexion
   docker logs -f portfolio | grep "connexion"

   # Alertes sur les échecs répétés (brute force)
   docker logs portfolio | grep "incorrect" | tail -20
   ```

### ❌ À NE JAMAIS FAIRE

1. **JAMAIS commiter le fichier `../.env.runtime`**
   - Le `.gitignore` le bloque déjà
   - Vérifier avant chaque commit : `git status`

2. **JAMAIS utiliser les valeurs par défaut en production**
   - `admin@portfolio.com` / `admin123` sont DANGEREUX
   - Le système refuse de démarrer sans configuration en production

3. **JAMAIS partager vos credentials**
   - JWT_SECRET : secret absolu
   - Hash du mot de passe : même hashé, ne pas exposer

4. **JAMAIS désactiver HTTPS en production**
   - Les cookies `secure: true` exigent HTTPS
   - Protection contre l'interception des tokens

---

## 🛠️ Opérations courantes

### Changer le mot de passe admin

1. Générer un nouveau hash :
   ```bash
   cd /volume2/docker/portefolio/source_code
   npm run create-admin
   ```

2. Mettre à jour `../.env.runtime` avec le nouveau hash :
   ```env
   ADMIN_PASSWORD_HASH=$2b$10$...nouveau_hash...
   ```

3. Redémarrer le container :
   ```bash
   docker-compose restart portfolio
   ```

### Changer l'email admin

Modifier directement dans `../.env.runtime` puis redémarrer :

```env
ADMIN_EMAIL=nouveau@email.com
```

```bash
docker-compose restart portfolio
```

### Révoquer tous les tokens (forcer déconnexion)

Changer le `JWT_SECRET` invalide tous les tokens existants :

```bash
# Générer un nouveau secret
openssl rand -base64 32

# Mettre à jour ../.env.runtime
JWT_SECRET=nouveau_secret_genere

# Redémarrer
docker-compose restart portfolio
```

Tous les utilisateurs devront se reconnecter.

### Débugger l'authentification

```bash
# Vérifier que les variables sont chargées
docker exec portfolio printenv | grep ADMIN

# Tester la connexion depuis le container
docker exec -it portfolio sh
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{"email":"votre@email.com","password":"votre_password"}'
```

---

## 🏗️ Architecture technique

### Flux d'authentification

```
1. Utilisateur → POST /api/auth/login
   ├─ Validation email + password
   ├─ Vérification bcrypt (hash stocké vs password)
   └─ Génération JWT signé avec JWT_SECRET

2. Serveur → Réponse avec cookie HttpOnly
   ├─ Cookie: admin_token=eyJhbGciOi...
   ├─ HttpOnly: true (pas accessible en JS)
   ├─ Secure: true (HTTPS uniquement en prod)
   └─ MaxAge: 7 jours

3. Requêtes suivantes → Middleware vérifie le token
   ├─ Extraction du cookie admin_token
   ├─ Vérification signature JWT
   ├─ Vérification expiration
   └─ Autorisation ou Rejet (401)
```

### Protection des routes API

Le middleware (`middleware.ts`) intercepte **toutes les requêtes** vers :
- `/admin/*`
- `/api/projects/*` (POST/PUT/DELETE)
- `/api/experiences/*` (POST/PUT/DELETE)
- `/api/formations/*` (POST/PUT/DELETE)

Les requêtes GET restent publiques.

### Limite CSP connue

La CSP conserve temporairement `script-src 'unsafe-inline'` pour la
compatibilité avec les scripts injectés par Next.js App Router. Les autres
directives restent restrictives et les entrées applicatives sont validées,
mais ce compromis ne remplace pas une migration future vers des nonces par
requête. En développement, HSTS et `upgrade-insecure-requests` sont désactivés
et les WebSockets locaux sont autorisés afin de préserver le rechargement à
chaud.

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `lib/auth.ts` | Authentification serveur et bcrypt |
| `lib/jwt.ts` | Signature et vérification JWT compatible middleware |
| `middleware.ts` | Protection des routes (Next.js Edge) |
| `app/api/auth/login/route.ts` | Endpoint de connexion |
| `app/api/auth/logout/route.ts` | Endpoint de déconnexion |
| `scripts/create-admin.js` | Générateur de credentials |
| `../.env.runtime` | Configuration secrète chargée par Compose (JAMAIS commitée) |

---

## 🔍 Dépannage

### Problème : "Erreur de configuration du serveur"

**Cause** : Variables d'environnement manquantes en production

**Solution** :
```bash
# Vérifier que ../.env.runtime existe sans afficher ses secrets
test -s ../.env.runtime

# Recréer les credentials si nécessaire
cd /volume2/docker/portefolio/source_code
npm run create-admin

# Redémarrer le container
docker-compose restart portfolio
```

### Problème : "Email ou mot de passe incorrect"

**Vérifications** :
1. Email exact (sensible à la casse)
2. Mot de passe correct (pas de fautes de frappe)
3. Hash bcrypt valide dans `../.env.runtime`

```bash
# Vérifier l'email configuré
docker exec portfolio printenv ADMIN_EMAIL

# Régénérer le hash si doute
cd /volume2/docker/portefolio/source_code
npm run create-admin
```

### Problème : Token expiré trop vite

`JWT_EXPIRES_IN` accepte une durée de 5 minutes à 7 jours. Pour utiliser la
durée maximale, configurez `../.env.runtime` ainsi :

```env
# Valeur maximale autorisée : 7 jours
JWT_EXPIRES_IN=604800
```

### Problème : Cookie non persistant

**Cause** : HTTPS non configuré en production

**Solution** : Vérifier Nginx/reverse proxy HTTPS
```bash
# Vérifier les certificats SSL
docker exec nginx_reverse_proxy nginx -t

# Forcer HTTPS dans ../.env.runtime
NODE_ENV=production
```

---

## 📚 Références

- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) - Hashing de mots de passe
- [jose](https://github.com/panva/jose) - JWT compatible Web/Edge Runtime
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Documentation officielle
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 📞 Support

En cas de problème de sécurité ou de question :

1. Consulter ce document en entier
2. Vérifier les logs : `docker logs portfolio`
3. Tester la config : `docker exec portfolio printenv`
4. Contacter l'administrateur : theo.stoffelbach@hotmail.com

---

**Dernière mise à jour** : 28 novembre 2024
**Version** : 3.0 (Authentification JWT + bcrypt)
