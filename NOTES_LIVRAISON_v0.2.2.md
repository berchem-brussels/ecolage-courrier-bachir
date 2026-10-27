# Notes de livraison, version 0.2.2 du 27/10/2026

## Périmètre

Préparation du dépôt public GitHub. Aucune fonction nouvelle, aucune migration de base, aucune dépendance ajoutée. Le serveur et l'interface ne changent que par leur numéro de version ; le verrou du serveur reçoit deux correctifs de sécurité.

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison et dans les fichiers du projet Claude.

## Cause racine et contrôle

| Sujet | Cause | Contrôle |
| --- | --- | --- |
| `npm audit` du serveur en échec | Deux avis parus après le 20/10/2026 : `body-parser` avant 1.20.9 (haute) et `fast-uri` de 3.0.0 à 3.1.8 (modérée), tous deux atteints par `express` et `ajv`. L'étape d'audit de la CI aurait échoué dès le premier envoi | `npm audit fix` limité au verrou : `body-parser` 1.20.9, `fast-uri` 3.1.9, `package.json` inchangé ; audit à 0 ; suites rejouées en entier |
| Valeurs de l'hôte écrites dans le dépôt | Documents de suivi et notes rédigés pour un usage interne ; `backup.sh` avec le dossier de l'hôte par défaut ; test de portabilité écrivant le préfixe d'adresse | Valeurs d'exemple dans les documents ; `backup.sh` déduit son dossier ; test `depot.test.js`, en échec avant l'assainissement et au vert après |
| Documents internes dans l'archive | `STANDARD.md` (constats de sécurité des autres applications), cahier des charges, fichier d'instance avec les services réels, une capture montrant ces services | Retirés de l'archive ; `.gitignore` et `depot.test.js` empêchent leur retour |

## Fichier d'instance

`backend/instance/atelier.json` n'est plus dans l'archive. Les services réels sont déjà en base ; le script d'atelier n'est pas rejoué à cette mise à jour. Une instance qui voudrait recharger ses services dépose son propre `atelier.json` dans ce dossier avant la construction ; il reste hors du dépôt.

## Dossier des sauvegardes

`backup.sh` ne contient plus de chemin de l'hôte. Il utilise la variable `BACKUP_DIR` si elle est posée ; sinon `backups/<APP_NAME>` placé deux niveaux au-dessus du dossier de l'application. Exemple : application dans `/srv/docker/courrier`, sauvegardes dans `/srv/backups/courrier`. La mise à jour se termine par une seconde sauvegarde qui le confirme.

## Ce qui est simulé ou incomplet

Inchangé depuis la 0.2.1 : base `sql.js` et données fictives, aucun courrier ni scan réel ; dépôt par un assistant IA limité à environ 190 ko (E21) ; fichier refusé non gardé dans la file (E22). Le passage de la CI sur GitHub n'a pas encore été observé : la simulation du premier envoi et des suites a été faite en local sur une copie propre.

## Trois questions RGPD

Aucune nouvelle donnée personnelle, aucune nouvelle finalité, aucun nouveau destinataire. Le dépôt public ne reçoit ni donnée réelle ni nom complet de personne.

## Mise à jour sur NIXUS

Les commandes sont données une à une dans la conversation, chacune avec son résultat attendu. Copie complète ci-dessous. Procédure ordinaire : pas de changement de propriétaire du volume, pas de migration. Pas de `--no-cache` : la construction rejoue de toute façon `npm ci` parce que le numéro de version change `package.json`.

Sur le PC, dans File Station : téléverser `courrier-v0_2_2.tar.gz` dans `docker/courrier`.

Sur le PC, dans PowerShell :

```bash
ssh utilisateur@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
ls -l courrier-v0_2_2.tar.gz
```

Attendu : le fichier listé, à la taille annoncée dans le message de livraison.

```bash
sudo bash backup.sh
```

Attendu : `sauvegarde terminée, N sauvegardes conservées.` Cette sauvegarde utilise encore l'ancien script.

```bash
sudo rm -rf backend frontend docs
```

```bash
sudo tar xzf courrier-v0_2_2.tar.gz --strip-components=1
```

```bash
ls backend frontend
```

Attendu : le contenu des deux dossiers.

```bash
sudo sh -c 'date; docker compose build; date'
```

Attendu : aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend`.

```bash
sudo docker compose up -d
```

Attendu : `courrier-api Healthy`, `courrier-web Started`.

```bash
sudo docker compose ps
```

Attendu : les deux conteneurs `Up (healthy)`.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.2.2"},"meta":{"envelope":1,"version":"0.2.2"}}`.

```bash
sudo bash backup.sh
```

Attendu : `sauvegarde terminée, N+1 sauvegardes conservées.` Cette seconde sauvegarde utilise le nouveau script.

```bash
ls -t /srv/backups/courrier | head -3
```

Attendu : deux fichiers `courrier-AAAAMMJJ-HHMM.tar.gz` datés du jour, dans l'ancien dossier des sauvegardes.

Ensuite, dans le navigateur du PC : `https://192.0.2.10:8450`, recharger avec Ctrl + F5, zoom à 100 % (Ctrl + 0), puis la liste de contrôle.

## Liste de contrôle à l'écran

1. En bas du menu : `v0.2.2`. Les courriers `AC-2026-000001` à `AC-2026-000005` et `CPAS-2026-000001` sont toujours là.
2. Registre : ouvrir `AC-2026-000004`. Ses deux fichiers s'affichent dans le lecteur et s'ouvrent.
3. « À enregistrer » : l'écran s'affiche et le cadre de dépôt est visible.

## Retour arrière

Rejouer les étapes de la mise à jour avec `courrier-v0_2_1.tar.gz`, restée dans le dossier. Aucune base à restaurer.

## Premier envoi sur GitHub

Le dépôt `berchem-brussels/ecolage-courrier-bachir` existe, public, sans initialisation. Les commandes de la section 4.2 de GITHUB.md sont données une à une dans la conversation, avec l'archive `courrier-v0_2_2.tar.gz` placée dans Téléchargements :

```powershell
mkdir C:\dev\ecolage-courrier-bachir
```

```powershell
cd C:\dev\ecolage-courrier-bachir
```

```powershell
git init
```

```powershell
tar -xzf $HOME\Downloads\courrier-v0_2_2.tar.gz --strip-components=1
```

```powershell
git add -A
```

```powershell
git commit -m "v0.2.2 : premier dépôt"
```

```powershell
git remote add origin https://github.com/berchem-brussels/ecolage-courrier-bachir.git
```

```powershell
git push -u origin main
```

```powershell
git tag v0.2.2
```

```powershell
git push origin v0.2.2
```

Attendu après la poussée : onglet Actions du dépôt, travail « tests » au vert.

## Points ouverts

- Protection de `main` à activer après le premier passage vert du travail « tests ».
- Écarts E16 à E24 (`ECARTS-CDC.md`), dont E23 au début de la 0.3.0.
- Notification par courriel de NIXUS toujours en panne.

## Liste de contrôle de la version (standard, section 18)

| Point | État |
| --- | --- |
| Aucune dépendance nouvelle, versions majeures inchangées | Conforme ; deux correctifs de verrou dans la même génération |
| Données, API, MCP, migrations | Inchangés |
| Tout texte en FR et NL | Conforme, aucun texte nouveau |
| Suites entières, 0 échec | Conforme : serveur 82, écrans 58 |
| Grille de sécurité | `docs/SECURITE.md` mise à jour |
| Trois questions RGPD | Aucune nouveauté |
| Nouveau numéro, archive vérifiée, commandes NIXUS | Conforme |
| Déploiement et recette sur NIXUS | À faire |
