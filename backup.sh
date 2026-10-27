#!/bin/sh
# Sauvegarde quotidienne du dossier de données (base et fichiers déposés), standard v3.2 section 15.6.
# À lancer chaque jour par une tâche planifiée du serveur :  bash /chemin/du/dossier/de/l-application/backup.sh
# Script POSIX, utilisable aussi par sh. Lit APP_NAME dans le .env voisin ; garde 30 jours de sauvegardes.
# Dossier des sauvegardes : la variable BACKUP_DIR si elle est posée ; sinon « backups/APP_NAME », placé à côté du dossier
# qui contient celui de l'application (deux niveaux au-dessus de lui). Exemple : application dans /srv/docker/monapp,
# sauvegardes dans /srv/backups/monapp.
set -e
cd "$(dirname "$0")"
APP_NAME=$(grep '^APP_NAME=' .env | cut -d= -f2)
PARENT=$(cd ../.. && pwd | sed 's:/$::')
BACKUP_DIR="${BACKUP_DIR:-$PARENT/backups/$APP_NAME}"
KEEP_DAYS=30
STAMP=$(date +%Y%m%d-%H%M)
mkdir -p "$BACKUP_DIR"
# docker cp vers « - » produit une archive tar du dossier /app/data entier : base app.db et dossiers de fichiers.
docker cp "$APP_NAME-api:/app/data" - | gzip > "$BACKUP_DIR/$APP_NAME-$STAMP.tar.gz"
find "$BACKUP_DIR" -name "$APP_NAME-*.tar.gz" -mtime +"$KEEP_DAYS" -delete
echo "[$APP_NAME] $(date) : sauvegarde terminée, $(ls -1 "$BACKUP_DIR"/"$APP_NAME"-*.tar.gz | wc -l) sauvegardes conservées."
