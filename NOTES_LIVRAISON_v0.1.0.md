# Notes de livraison, version 0.1.0 du 13/10/2026

## Périmètre

Étape 1 du planning : enregistrement et numérotation du courrier entrant (sans pièce), registre des entrées, fiche, annulation avec motif, contacts, services, types de courrier, entités et registres, rôles par entité. Hors lot : pièces scannées, attribution, confidentialité, connexion Microsoft 365, PostgreSQL.

## Ce qui est simulé ou incomplet

- Base `sql.js` : maquette d'atelier. Les types de courrier et les contacts sont fictifs et marqués « Fictif ». Les 24 services sont réels (noms seuls).
- Noms NL : 3 services ont leur nom officiel ; 21 noms proposés sont marqués « NL à valider ». Les libellés NL des types fictifs sont aussi à valider.
- Connexion par comptes locaux seulement.
- Aucun courrier réel ne doit être enregistré dans cette version.

## Cause racine des défauts corrigés pendant le développement

| Défaut | Cause | Test de non-régression |
| --- | --- | --- |
| Groupes de boutons obligatoires signalés par axe-core (`aria-allowed-attr`) | `Form.Item` pose `aria-required` sur un `div` sans rôle | Audit axe-core de l'écran d'enregistrement en FR et NL |
| En-tête plus large que l'écran à 768 px (822 px mesurés) | Gabarit : nom de la personne, thème et étiquette d'environnement dans un en-tête de 538 px utiles | Mesure `scrollWidth` en 360, 768 et 1280 px lors des captures |

## Trois questions RGPD

1. Nouvelles données personnelles : oui. Contacts (nom, prénom, adresse, courriel, téléphone, langue) et objet du courrier. À inscrire au registre des traitements et à l'analyse d'impact menées en parallèle.
2. Nouvelle finalité : non, la gestion du courrier existe déjà avec l'outil actuel.
3. Nouveau destinataire : non. Aucun appel sortant ; aucune police ni script chargé depuis internet.

## Déploiement sur NIXUS, première installation

Les commandes sont données une à une dans la conversation, avec le résultat attendu de chacune. Copie complète ci-dessous.

Dans File Station, sur le PC : créer le dossier `courrier` dans le dossier partagé `docker`, puis y téléverser `courrier-v0_1_0.tar.gz`.

Sur le PC, dans PowerShell :

```bash
ssh utilisateur@192.0.2.10
```

Sur NIXUS, dans la session SSH :

```bash
cd /srv/docker/courrier
```

```bash
sudo tar xzf courrier-v0_1_0.tar.gz --strip-components=1
```

```bash
ls
```

Attendu : `backend`, `frontend`, `docs`, `docker-compose.yml`, `backup.sh`, `verifier-ports.sh` et les fichiers de suivi.

```bash
sudo sh verifier-ports.sh 8450 8090
```

Attendu : `Port 8450 : LIBRE` et `Port 8090 : LIBRE`.

```bash
printf 'APP_NAME=%s\nHTTPS_PORT=%s\nHTTP_PORT=%s\nPUBLIC_HOST=%s\nAPP_ENVIRONMENT=%s\nJWT_SECRET=%s\nCONFIG_ENC_KEY=%s\n' courrier 8450 8090 192.0.2.10 acceptance "$(openssl rand -hex 32)" "$(openssl rand -hex 32)" | sudo tee .env > /dev/null
```

```bash
sudo chmod 600 .env
```

```bash
sudo sh -c 'date; docker compose build; date'
```

Attendu : deux dates encadrant la construction, qui donnent sa durée ; aucune ligne `ERROR`.

```bash
sudo docker compose run --rm --no-deps backend node scripts/donnees-atelier.js
```

Attendu, en dernière ligne : `[ATELIER] atelier.json : 2 paramètres, 24 services, 15 types, 6 contacts ajoutés.`

```bash
sudo docker compose up -d
```

```bash
sudo docker compose ps
```

Attendu, après une minute : `courrier-api` et `courrier-web` en `Up (healthy)`.

```bash
curl -sk https://localhost:8450/api/version
```

Attendu : `{"data":{"version":"0.1.0"},"meta":{"envelope":1,"version":"0.1.0"}}`

```bash
sudo docker compose exec backend id -u
```

Attendu : `1000` (utilisateur `node`, non root).

Dans le navigateur du PC : `https://192.0.2.10:8450`, accepter le certificat auto-signé, créer le premier administrateur.

Tâche DSM de sauvegarde : Panneau de configuration, Planificateur de tâches, utilisateur `root`, chaque jour à 02:00, script `bash /srv/docker/courrier/backup.sh`.

## Liste de contrôle à l'écran

1. L'écran d'installation crée le premier administrateur ; l'étiquette « Acceptance : données fictives » est visible.
2. Utilisateurs : l'administrateur se donne le rôle « Secrétariat » à l'AC, puis se déconnecte et se reconnecte.
3. Le menu Courrier apparaît : Registre des entrées, Enregistrer un courrier, Contacts.
4. Enregistrer un courrier : le premier numéro est `AC-2026-000001` ; le formulaire se vide en gardant la date et le mode d'arrivée.
5. « Nouveau contact » crée un expéditeur et le choisit sans quitter le formulaire.
6. Le registre liste le courrier ; la recherche par numéro et par objet le retrouve.
7. La fiche permet de corriger l'objet et d'annuler avec un motif ; le numéro annulé reste visible avec le filtre « Annulé ».
8. Un compte qui n'a que le rôle « Secrétariat » au CPAS ne voit aucun courrier de l'AC.
9. Services : 24 services, dont 4 marqués « Commun » ; les noms NL proposés portent « NL à valider ».
10. Tout fonctionne en NL, en thème sombre et sur un téléphone.

## Points ouverts

- Validation des noms NL des services par un collègue néerlandophone.
- Signification des sigles RD et SCAD ; service qui enregistre le courrier du CPAS (nécessaire à l'étape 13).
- Durée de construction sur NIXUS, à relever à cette installation.
- Montée de `react-router-dom` en version 7 pour corriger 3 vulnérabilités modérées : décision de Renaud.
