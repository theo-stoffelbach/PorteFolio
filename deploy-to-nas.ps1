# Script PowerShell de déploiement sur NAS UGREEN
# Usage: .\deploy-to-nas.ps1

# Variables à configurer
$NAS_USER = "Theo"
$NAS_IP = "192.168.1.3"
$NAS_PATH = "/volume1/Docker_data/portefolio/PorteFolio"

Write-Host "🚀 Déploiement Portfolio sur NAS UGREEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  - User: $NAS_USER"
Write-Host "  - IP: $NAS_IP"
Write-Host "  - Path: $NAS_PATH"
Write-Host ""

$confirmation = Read-Host "Est-ce que ces paramètres sont corrects ? (y/n)"
if ($confirmation -ne 'y') {
    Write-Host "❌ Annulé. Modifie les variables dans le script." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Connexion au NAS et déploiement..." -ForegroundColor Cyan

$commands = @"
cd $NAS_PATH 2>/dev/null || {
    echo '📁 Création du dossier $NAS_PATH'
    mkdir -p $NAS_PATH
    cd $NAS_PATH
}

echo '📥 Téléchargement du docker-compose.yml...'
curl -sSL https://raw.githubusercontent.com/theo-stoffelbach/PorteFolio/V3_PorteFolio/docker-compose.yml -o docker-compose.yml

echo '📁 Création du dossier data...'
mkdir -p data

echo '🐳 Lancement des containers...'
docker compose pull
docker compose up -d

echo ''
echo '✅ Déploiement terminé !'
echo ''
echo '📊 Status des containers:'
docker compose ps
echo ''
echo '🌐 Accès: http://192.168.1.3:3000'
echo '📝 Logs: docker compose logs -f portfolio'
"@

ssh "$NAS_USER@$NAS_IP" $commands

Write-Host ""
Write-Host "🎉 C'est bon ! Ton portfolio tourne sur http://$NAS_IP:3000" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Vérifie que le package GitHub est public"
Write-Host "  2. Push sur V3_PorteFolio pour déclencher le build"
Write-Host "  3. Watchtower mettra à jour automatiquement toutes les 5 min"

