# Portfolio Théo Stoffelbach

Portfolio professionnel inspiré du design GitHub, développé avec Next.js 16, TypeScript, et Tailwind CSS.

## Technologies

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS** + **Primer CSS**
- **Framer Motion** (animations)
- **Docker** (déploiement)

## Structure du Projet

```
/app                 # Pages Next.js App Router
  /api              # API Routes REST
  /experiences      # Page expériences
  /projets          # Page projets
  /formation        # Page formation
  /contact          # Page contact
/components         # Composants React réutilisables
/data               # Données JSON (projets, expériences, formations)
/lib                # Utilitaires et types TypeScript
/public             # Assets statiques
```

## Installation et Développement

### Prérequis

- Node.js 22+
- npm ou yarn

### Installation

```bash
npm install
```

### Développement

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Build de Production

```bash
npm run build
npm start
```

## Déploiement

### Déploiement Local

Le réseau externe est partagé avec Nginx Proxy Manager. Il doit être créé une
seule fois sur l'hôte avant le premier démarrage :

```bash
docker network create portfolio_public
docker compose up -d --build
```

Le Compose ne publie volontairement aucun port hôte. Le portfolio est
accessible via Nginx Proxy Manager, connecté au même réseau
`portfolio_public`. Pour un accès direct en développement, utilisez plutôt
`npm run dev` puis `http://localhost:3000`.

### Déploiement sur NAS

GitHub Actions publie l'image dans GHCR. Sur le NAS, le Watchtower centralisé et
sécurisé détecte le label du service Portfolio puis vérifie les mises à jour
toutes les cinq minutes. Aucun socket Docker n'est monté dans ce Compose.

**Workflow :**

1. Push sur `main` → GitHub Actions teste et construit l'image
2. Image publiée sur GitHub Container Registry (GHCR)
3. Le Watchtower centralisé détecte automatiquement la nouvelle image
4. Portfolio mis à jour sur le NAS (toutes les 5 min)

**Déploiement initial :**

```bash
# Windows (PowerShell)
.\deploy-to-nas.ps1

# Linux/Mac
./deploy-to-nas.sh
```

**OU manuellement :**

```bash
ssh Theo@192.168.1.3
cd /volume2/docker/portefolio/source_code
docker network inspect portfolio_public >/dev/null 2>&1 || docker network create portfolio_public
docker compose pull
docker compose up -d
```

**Documentation complète :** Voir [DEPLOY.md](DEPLOY.md)

### Configuration

Le fichier `docker-compose.yml` configure:

- Port interne exposé au seul réseau `portfolio_public` (aucun port hôte)
- Volume pour persistance des données (`/data`)
- Healthcheck automatique
- Restart automatique
- Label opt-in pour le Watchtower centralisé du NAS

## API REST

### Endpoints Disponibles

- `GET /api/projects` - Liste des projets
- `GET /api/projects/[id]` - Détails d'un projet
- `POST /api/projects` - Créer un projet
- `PUT /api/projects/[id]` - Modifier un projet
- `DELETE /api/projects/[id]` - Supprimer un projet

- `GET /api/experiences` - Liste des expériences
- `GET /api/experiences/[id]` - Détails d'une expérience
- `POST /api/experiences` - Créer une expérience
- `PUT /api/experiences/[id]` - Modifier une expérience
- `DELETE /api/experiences/[id]` - Supprimer une expérience

- `GET /api/formations` - Liste des formations
- `GET /api/formations/[id]` - Détails d'une formation
- `POST /api/formations` - Créer une formation
- `PUT /api/formations/[id]` - Modifier une formation
- `DELETE /api/formations/[id]` - Supprimer une formation

- `GET /api/activity/[year]` - Grille d'activité GitHub par année

## Gestion des Données

Les données sont stockées dans `/data` au format JSON:

- `projects.json` - Projets avec semaines de travail
- `experiences.json` - Expériences professionnelles
- `formations.json` - Formations académiques

### Format d'un Projet

```json
{
  "id": "pokedex-2025",
  "title": "Pokédex Interactive",
  "description": "Description du projet",
  "technologies": ["NodeJS", "React"],
  "imageUrl": "/images/projects/pokedex.jpg",
  "projectUrl": "https://github.com/...",
  "color": "#3b82f6",
  "weeks": [40, 41, 42, 43, 44, 45],
  "year": 2025,
  "featured": true
}
```

## Personnalisation

### Palette de Couleurs GitHub

Modifié dans `tailwind.config.ts`:

- `github-gray-dark`: #24292e
- `github-gray`: #586069
- `github-gray-light`: #f6f8fa
- `github-blue`: #0366d6
- `github-green`: #28a745
- `github-border`: #e1e4e8

### Remplacement des Images

Remplacez les fichiers dans `/public/images`:

- `profile.jpg` → Votre photo de profil
- `/projects/*.jpg` → Screenshots de vos projets

## 🔐 Sécurité et Authentification

Le portfolio dispose d'un système d'authentification sécurisé pour protéger les routes admin et les API de modification.

### Configuration rapide

```bash
# 1. Générer un compte admin
npm run create-admin

# 2. Copier les variables générées dans .env
cp .env.example .env
# Puis éditer .env avec les valeurs générées

# 3. Déployer
docker-compose up -d
```

### Fonctionnalités de sécurité

- ✅ **Mots de passe hashés** avec bcrypt (10 rounds)
- ✅ **Tokens JWT** signés pour l'authentification stateless
- ✅ **Cookies HttpOnly** protection contre XSS
- ✅ **Routes API protégées** (POST/PUT/DELETE nécessitent authentification)
- ✅ **Panel admin** accessible sur `/admin` (protégé)
- ✅ **Variables d'environnement** pour les credentials (jamais en dur)

### Documentation complète

Consultez [SECURITY.md](SECURITY.md) pour :
- Configuration détaillée
- Bonnes pratiques de sécurité
- Dépannage
- Architecture technique

## Auteur

Théo Stoffelbach - theo.stoffelbach@hotmail.com
