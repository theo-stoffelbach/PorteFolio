# 🚀 Guide de déploiement sur NAS UGREEN

## Architecture

```text
Push sur main → GitHub Actions → GHCR → Watchtower centralisé → Portfolio
                                      ↘ Docker Socket Proxy sécurisé
```

Le Compose Portfolio ne monte pas le socket Docker et ne publie aucun port sur
l'hôte. Nginx Proxy Manager rejoint `portfolio_public` pour servir
`https://theo-stoffelbach.fr`.

## Prérequis

- Docker et Docker Compose installés sur le NAS ;
- accès SSH au NAS ;
- réseau externe `portfolio_public` partagé avec Nginx Proxy Manager ;
- fichier secret `/volume2/docker/portefolio/.env.runtime` en mode `600` ;
- package GHCR accessible avec les credentials du NAS.

## Configuration initiale

```bash
ssh Theo@192.168.1.3
cd /volume2/docker/portefolio/source_code

# Créer le réseau une seule fois s'il n'existe pas encore
docker network inspect portfolio_public >/dev/null 2>&1 || docker network create portfolio_public

# Ne jamais afficher le contenu du fichier secret
test -s ../.env.runtime
stat -c '%a %n' ../.env.runtime  # attendu : 600 ../.env.runtime

docker compose pull
docker compose up -d
docker compose ps
```

Le service est accessible par le domaine NPM, pas par
`http://192.168.1.3:3000`. Le port 3000 reste interne au réseau Docker.

## Déployer une mise à jour

1. Commit et push sur `main`.
2. GitHub Actions exécute lint, TypeScript, tests, audits et builds Docker.
3. Après succès, l'image `ghcr.io/theo-stoffelbach/portefolio:latest` est publiée.
4. Le Watchtower centralisé du NAS détecte le label opt-in du conteneur toutes
   les cinq minutes et applique la nouvelle image.

Pour forcer une mise à jour sans attendre le prochain passage :

```bash
ssh Theo@192.168.1.3
cd /volume2/docker/portefolio/source_code
docker compose pull portfolio
docker compose up -d portfolio
docker compose ps
```

## Vérifications et logs

```bash
# État et logs applicatifs
cd /volume2/docker/portefolio/source_code
docker compose ps
docker compose logs --tail 100 portfolio

# Healthcheck interne, sans publier le port
docker exec portfolio wget --quiet --tries=1 --spider http://127.0.0.1:3000

# Watchtower centralisé
docker logs --tail 100 watchtower-central
```

- GitHub Actions : <https://github.com/theo-stoffelbach/PorteFolio/actions>
- Application : <https://theo-stoffelbach.fr>

## Exploitation

```bash
cd /volume2/docker/portefolio/source_code

# Redémarrer
docker compose restart portfolio

# Arrêter
docker compose down

# Relancer
docker compose up -d
```

## Troubleshooting

### Le conteneur ne se met pas à jour

```bash
docker inspect portfolio --format '{{ index .Config.Labels "com.centurylinklabs.watchtower.enable" }}'
docker logs --tail 100 watchtower-central

cd /volume2/docker/portefolio/source_code
docker compose pull portfolio
docker compose up -d portfolio
```

Le label attendu est `true`. La configuration du Watchtower centralisé vit dans
`/volume2/docker/watchtower-central/`, pas dans cette stack.

### Erreur d'accès à l'image GHCR

Vérifier les credentials du registry configurés pour le Watchtower centralisé,
ou la visibilité du package. Ne jamais copier un token dans le Compose.

### Erreur Nginx Proxy Manager / 502

```bash
docker compose ps
docker network inspect portfolio_public
docker exec portfolio wget --quiet --tries=1 --spider http://127.0.0.1:3000
```

Le conteneur `portfolio` et Nginx Proxy Manager doivent tous deux apparaître
sur `portfolio_public`. L'ajout d'un port hôte n'est pas nécessaire.

## Backup

Les données persistantes se trouvent dans `source_code/data/`. Inclure ce
dossier dans les sauvegardes du NAS avant toute restauration ou migration.
