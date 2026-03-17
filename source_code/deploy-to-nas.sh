#!/bin/bash

# Script de déploiement rapide sur NAS UGREEN
# Usage: ./deploy-to-nas.sh

set -e

echo "Déploiement Portfolio sur NAS UGREEN"
echo "========================================"
echo ""

# Variables à configurer
NAS_USER="Theo"
NAS_IP="192.168.1.3"
NAS_PATH="/volume1/Docker_data/portefolio/PorteFolio"

echo "Configuration:"
echo "  - User: $NAS_USER"
echo "  - IP: $NAS_IP"
echo "  - Path: $NAS_PATH"
echo ""

read -p "Est-ce que ces parametres sont corrects ? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Annulé. Modifie les variables dans le script."
    exit 1
fi

echo ""
echo "Connexion au NAS et déploiement..."

ssh $NAS_USER@$NAS_IP << 'ENDSSH'
cd $NAS_PATH 2>/dev/null || {
    echo "Creation du dossier $NAS_PATH"
    mkdir -p $NAS_PATH
    cd $NAS_PATH
}

echo "Téléchargement du docker-compose.yml..."
curl -sSL https://raw.githubusercontent.com/theo-stoffelbach/PorteFolio/V3_PorteFolio/docker-compose.yml -o docker-compose.yml

echo "Création du dossier data..."
mkdir -p data

echo "Lancement des containers..."
docker compose pull
docker compose up -d

echo ""
echo "Déploiement terminé !"
echo ""
echo "Status des containers:"
docker compose ps
echo ""
echo "Acces: http://192.168.1.3:3000"
echo "Logs: docker compose logs -f portfolio"
ENDSSH

echo ""
echo "C'est bon ! Ton portfolio tourne sur http://$NAS_IP:3000"
echo ""
echo "Prochaines étapes:"
echo "  1. Vérifie que le package GitHub est public"
echo "  2. Push sur V3_PorteFolio pour déclencher le build"
echo "  3. Watchtower mettra à jour automatiquement toutes les 5 min"

