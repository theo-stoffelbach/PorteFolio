#!/bin/bash
# =============================================================================
# Script de mise à jour automatique du portfolio (alternative à Watchtower)
# À exécuter via cron sur l'hôte : 
#   crontab -e
#   0 4 * * * /volume2/docker/portefolio/update-portfolio.sh
# =============================================================================

set -e

COMPOSE_DIR="/volume2/docker/portefolio/source_code"
LOG_FILE="/volume2/docker/portefolio/update.log"
IMAGE="ghcr.io/theo-stoffelbach/portefolio:latest"

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Démarrage de la mise à jour ==="

# Pull de la nouvelle image
log "Pull de l'image: $IMAGE"
if docker pull "$IMAGE" 2>&1 | tee -a "$LOG_FILE" | grep -q "Downloaded newer image"; then
    log "Nouvelle version détectée, redémarrage..."
    cd "$COMPOSE_DIR"
    docker-compose up -d portfolio
    log "Redémarrage effectué avec succès"
    
    # Nettoyer les anciennes images
    docker image prune -f 2>&1 | tee -a "$LOG_FILE"
else
    log "Aucune mise à jour disponible"
fi

log "=== Mise à jour terminée ==="
