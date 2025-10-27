# 🚀 Guide de déploiement sur NAS UGREEN

## Architecture

```
GitHub Push → GitHub Actions → GHCR → Watchtower → NAS (192.168.1.3)
```

## Prérequis

- Docker installé sur le NAS
- Accès SSH au NAS
- Compte GitHub (déjà fait ✅)

## Configuration initiale (à faire une seule fois)

### 1. Rendre le package GitHub public

Pour que le NAS puisse pull l'image sans authentification :

1. Va sur https://github.com/theo-stoffelbach/PorteFolio/settings
2. Scroll en bas → **Danger Zone** → Change visibility → **Public**

**OU** si tu veux garder le repo privé :

1. Va sur https://github.com/theo-stoffelbach?tab=packages
2. Clique sur le package `portefolio`
3. Package settings → Change visibility → **Public**

### 2. Déployer sur le NAS

```bash
# Se connecter au NAS
ssh Theo@192.168.1.3

# Aller dans le dossier du projet
cd /volume1/Docker_data/portefolio/PorteFolio

# OU si le dossier n'existe pas encore
# mkdir -p /volume1/Docker_data/portefolio/PorteFolio
# cd /volume1/Docker_data/portefolio/PorteFolio
# git clone https://github.com/theo-stoffelbach/PorteFolio.git .

# OU si pas de git, créer le docker-compose.yml manuellement
# (copier le contenu depuis GitHub)

# Créer le dossier data si besoin
mkdir -p data

# Lancer les containers
docker compose up -d
```

### 3. Vérifier que ça tourne

```bash
# Voir les logs
docker compose logs -f portfolio

# Vérifier les containers
docker ps

# Tester l'accès
curl http://localhost:3000
```

Ensuite, accède à **http://192.168.1.3:3000** depuis ton navigateur ! 🎉

## Utilisation quotidienne

### Déployer une mise à jour

1. Fais tes modifications en local
2. Commit et push sur la branche `V3_PorteFolio`
3. GitHub Actions build et push l'image automatiquement
4. Watchtower détecte la nouvelle image (toutes les 5 min)
5. Watchtower met à jour le container automatiquement

**C'est tout ! Plus rien à faire sur le NAS. 🚀**

### Forcer une mise à jour immédiate

```bash
ssh Theo@192.168.1.3
cd /volume1/Docker_data/portefolio/PorteFolio
docker compose pull portfolio
docker compose up -d
```

### Voir les logs Watchtower

```bash
docker logs watchtower -f
```

### Arrêter les containers

```bash
docker compose down
```

### Redémarrer les containers

```bash
docker compose restart
```

## Monitoring

### Vérifier l'état du déploiement

- GitHub Actions : https://github.com/theo-stoffelbach/PorteFolio/actions
- Package GHCR : https://github.com/theo-stoffelbach?tab=packages

### Watchtower vérifie toutes les 5 minutes

Si tu veux changer l'intervalle, modifie `WATCHTOWER_POLL_INTERVAL` dans le docker-compose.yml (en secondes).

## Troubleshooting

### Le container ne se met pas à jour

```bash
# Vérifier que Watchtower tourne
docker ps | grep watchtower

# Voir les logs Watchtower
docker logs watchtower

# Forcer une vérification
docker exec watchtower watchtower --run-once
```

### Erreur "permission denied" pour l'image

→ Rendre le package public (voir étape 1)

### Le port 3000 est déjà utilisé

Modifier dans docker-compose.yml :

```yaml
ports:
  - "3001:3000" # ou un autre port libre
```

## Configuration avancée

### Changer le port

Dans `docker-compose.yml` :

```yaml
ports:
  - "8080:3000" # Accès via http://192.168.1.3:8080
```

### Ajouter un reverse proxy

Si tu utilises Nginx Proxy Manager ou Traefik, ajoute les labels appropriés dans le docker-compose.yml.

### Notifications Watchtower

Ajoute dans les env vars de Watchtower :

```yaml
environment:
  - WATCHTOWER_NOTIFICATIONS=email
  - WATCHTOWER_NOTIFICATION_EMAIL_TO=ton@email.com
  - WATCHTOWER_NOTIFICATION_EMAIL_FROM=nas@home.local
```

## Backup

Les données sont dans le volume `./data` sur le NAS. Pense à les inclure dans tes backups !

---

**Questions ? Check les logs des containers !** 📝
