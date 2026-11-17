# Après déploiement

Application courrier · version 0.3.1 · journal des déploiements au 17/11/2026

Ce fichier reprend en tête les procédures sur NIXUS, puis un bloc par version déployée, la plus récente d'abord. Les commandes se donnent une à une dans la conversation, avec leur résultat attendu, et la suivante n'arrive qu'après le résultat de la précédente. Chaque commande dit sur quelle machine elle s'exécute.

## 1. Procédures

### 1.1 Règles

1. File Station sert seulement à créer le dossier et à téléverser l'archive.
2. Tout le reste se fait en SSH, depuis PowerShell sur le PC : `ssh administrator@192.0.2.10`. Le message `Could not chdir to home directory` est sans conséquence.
3. Aucun fichier ne s'édite à la main sur le NAS. Le `.env` ne se recrée jamais.
4. Une sauvegarde précède toute mise à jour.
5. L'ancien code (`backend`, `frontend`, `docs`) est retiré avant l'extraction.
6. Le script d'atelier écrit dans la base : le conteneur `courrier-api` doit être arrêté pendant qu'il tourne.
7. En cas de problème, les journaux d'abord : `sudo docker logs courrier-api --tail 30`.
8. Aucun mot de passe ni secret dans une capture envoyée à Claude.
9. Les commandes de GitHub se tapent dans PowerShell sur le PC, jamais dans la session SSH de NIXUS : `exit` ferme la session SSH d'abord. L'archive doit être dans `Téléchargements` : si le navigateur l'a rangée dans un dossier OneDrive, la copier d'abord.

### 1.2 Mise à jour (modèle, à adapter au numéro livré)

Sur le PC, dans File Station : téléverser `courrier-vX_Y_Z.tar.gz` dans `docker/courrier`, à côté des archives précédentes.

Sur NIXUS, en SSH, une commande à la fois :

| # | Commande | Résultat attendu |
| --- | --- | --- |
| 1 | `cd /srv/docker/courrier` | L'invite affiche le dossier |
| 2 | `ls -l courrier-vX_Y_Z.tar.gz` | Le fichier, à la taille annoncée dans les notes de livraison |
| 3 | `sudo bash backup.sh` | `sauvegarde terminée, N sauvegardes conservées` ; N proche du nombre de jours depuis le 13/10/2026 |
| 4 | `sudo rm -rf backend frontend docs` | Aucun message |
| 5 | `sudo tar xzf courrier-vX_Y_Z.tar.gz --strip-components=1` | Aucun message |
| 6 | `ls backend frontend` | Le contenu des deux dossiers |
| 7 | `sudo sh -c 'date; docker compose build; date'`, avec `build --no-cache` quand les notes l'annoncent (Dockerfile ou dépendance modifiés) | Aucune ligne `ERROR` ; `naming to docker.io/library/courrier-backend` et `courrier-frontend` |
| 8 | Seulement si les notes le demandent : `sudo docker compose stop backend`, puis la commande ponctuelle des notes (script d'atelier, changement de propriétaire du volume) | `Container courrier-api Stopped`, puis la sortie annoncée |
| 9 | `sudo docker compose up -d` | `courrier-api Healthy`, `courrier-web Started` |
| 10 | `sudo docker compose ps` | Les deux conteneurs `Up (healthy)` |
| 11 | `curl -sk https://localhost:8450/api/version` | `{"data":{"version":"X.Y.Z"},"meta":{"envelope":1,"version":"X.Y.Z"}}` |

Puis, dans le navigateur du PC : `https://192.0.2.10:8450`, recharger avec Ctrl + F5, et suivre la liste de contrôle des notes de livraison.

Retour arrière : rejouer les étapes 3 à 11 avec l'archive précédente, restée dans le dossier, sans le script d'atelier. La base ne se restaure (depuis `/srv/backups/courrier`) que si la version retirée a appliqué une migration.

### 1.3 Première installation

Faite le 13/10/2026 (bloc 0.1.0). La procédure complète est dans `NOTES_LIVRAISON_v0.1.0.md` de l'archive. Elle ne se rejoue pas : le dossier, le `.env`, les volumes et la tâche de sauvegarde existent.

## 2. Version 0.3.1, livrée le 17/11/2026, à déployer

Aucune migration nouvelle, aucune dépendance changée : construction sans `--no-cache` (prévoir une dizaine de minutes). Procédure du 1.2 avec `courrier-v0_3_1.tar.gz` ; taille et empreinte SHA-256 dans le message de livraison. Les mêmes commandes qu'en 0.3.0 : sauvegarde, `tar tzf`, retrait de `backend frontend docs`, extraction, construction, démarrage, version.

| Étape | Résultat attendu |
| --- | --- |
| Démarrage | `[APP] API 0.3.1 sur le port 3001` ; aucune ligne `[DB] Migration` (la 009 est déjà appliquée) ; `courrier-api Healthy` |
| Version | `{"data":{"version":"0.3.1"},"meta":{"envelope":1,"version":"0.3.1"}}` |
| Script `recette.mjs` | 38 contrôles conformes avec `RECETTE_VERSION` laissé par défaut (0.3.1) |
| Script `recette-agent.mjs` (PC, mêmes variables) | Environ 45 contrôles conformes, sans `ÉCHEC`. Il crée trois comptes de test et un courrier fictif, puis annule le courrier avec un motif (son numéro reste au registre, « annulé ») et désactive les comptes ; rapport `rapport-agent.txt` et deux captures `agent-fiche.png` et `secretariat-renvoi.png` dans le dossier du script (elles montrent des données fictives et aucun mot de passe) |
| Comptes de test | Trois comptes `recette-…@exemple.test` désactivés dans Administration › Utilisateurs ; si le script a été interrompu, les désactiver à la main et annuler le courrier d'essai |
| Retour arrière | Procédure du 1.2 avec l'archive 0.3.0, restée dans le dossier ; aucune migration nouvelle : pas de restauration de la base |

## 3. Version 0.3.0, déployée le 17/11/2026, non publiée, remplacée par la 0.3.1

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_3_0.tar.gz`, 3 170 032 octets (déposée par File Station, 15:32:40) ; SHA-256 `8b1e0e379e5223abdfdb747557287f9131b6c162acc6f12cf5cabc32883b0006` identique sur le PC (dossier OneDrive) et dans l'archive de Claude ; taille relevée sur NIXUS : 3170032 |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 45 sauvegardes conservées.` à 16:40:58 |
| Extraction | Archive testée (`tar tzf`, « archive lisible ») avant la suppression de l'ancien code ; `attribution.js`, `BannettesPage.tsx` et `recette-faq.mjs` présents après l'extraction |
| Construction | `docker compose build` sans `--no-cache` : 30 étapes sur 30, sans erreur ; 16:42:23 à 16:50:46, soit 8 min 19 s (499,0 s) ; contexte du frontend 3,00 Mo ; plus long que la durée annoncée (3 à 6 minutes, images lentes à charger comme en 0.2.6) |
| Démarrage | `[DB] Migration 009_attribution appliquée` ; `[APP] API 0.3.0 sur le port 3001` ; `courrier-api Healthy` en 44,1 s, `courrier-web Started` en 41,2 s ; les deux conteneurs `(healthy)`, ports 8090 et 8450 |
| Version | `{"data":{"version":"0.3.0"},"meta":{"envelope":1,"version":"0.3.0"}}` |
| Script `recette.mjs` (PC du conducteur, Node v24.11.1, Playwright 1.64.1, Chrome du poste) | 38 contrôles conformes : version `v0.3.0`, onglets « À enregistrer (1) » et « À attribuer (6) », menu « Bannettes » en premier, cloche, compteurs de l'API, panneau d'aide des bannettes avec deux repères, cadre « Attribution » de la fiche et bouton « Attribuer », FAQ complète, quinze fiches, parcours avec `#`, et **aucune remarque de Chrome ni étiquette mal reliée** sur 13 écrans et fenêtres, dont « Bannettes » et « Modifier les rôles » |
| Script `recette-agent.mjs` | Non joué sur la 0.3.0 : écrit après l'installation, il a trouvé sur la démonstration le défaut corrigé en 0.3.1 ; à jouer sur la 0.3.1 |
| Constats | Contrôle manuel dans le navigateur remplacé par des scripts à la demande du conducteur ; aucun incident de procédure |

## 4. Version 0.2.9, déployée, recettée et publiée le 17/11/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_9.tar.gz`, 2 958 067 octets (déposée par File Station) ; SHA-256 `0bb3efdd06204559e6ed246b7d2073af191de9596ee373e7a385f569f70d837a` identique sur le PC (dossier OneDrive puis `Téléchargements`), sur GitHub et dans l'archive de Claude |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 44 sauvegardes conservées.` à 14:02:51 |
| Extraction | Archive testée (`tar tzf`) avant la suppression de l'ancien code ; `backend` et `frontend` complets (dossier `help-capture` présent) |
| Construction | `docker compose build` sans `--no-cache` : 30 étapes sur 30, sans erreur ; 14:03:56 à 14:09:03, soit 5 min 7 s (305,3 s) ; contexte du frontend 2,60 Mo |
| Démarrage | Aucune migration nouvelle ; `[APP] API 0.2.9 sur le port 3001` ; `courrier-api Healthy` en 57,2 s, `courrier-web Started` en 45,0 s ; les deux conteneurs `(healthy)` |
| Version | `{"data":{"version":"0.2.9"},"meta":{"envelope":1,"version":"0.2.9"}}` |
| Script de recette `recette-0.2.9.mjs` (PC du conducteur, Node v24.11.1, Chrome du poste) | 23 contrôles conformes : version `v0.2.9`, panneau du registre avec capture annotée, trois repères, marge des puces, nginx (HTTP 200 pour `/help` et l'image JPEG), néerlandais, clés brutes, quatorze fiches, parcours avec `#` (14 puis 9), image de « Créer un compte » dans la bonne procédure, et **aucune remarque de Chrome ni étiquette mal reliée ni champ sans nom** sur 11 écrans et fenêtres (Enregistrer un courrier, Contacts, Utilisateurs, Paramètres, Services, Types, Entités et registres : ligne et registre, Tickets, Aide, Registre : fiche d'un courrier). Un échec : la FAQ, par collision du titre d'essai avec la question retirée du lancement de la 0.2.8 (défaut du script) |
| Script `recette-faq.mjs` | Premier essai : échec « Execution context was destroyed » (appel lancé pendant la redirection qui suit la connexion, défaut du script). Version corrigée (`recette-faq-2.mjs`) : nettoyage d'une question d'essai restée active, puis 5 contrôles conformes (création, correction, retrait sans suppression, mention « Retirée », disparition du panneau) |
| Dépôt GitHub | Branche `version/v0.2.9` (commit `0dc99eb`, 113 fichiers : 48 `A`, 65 `M`, aucun `D`) ; alerte CodeQL « High » sur `demo-server.cjs` (3 occurrences) corrigée par le commit `82ca4fa` (3 fichiers) ; demande de fusion n° 7, quatre contrôles verts, commentaires de CodeQL résolus ; fusion `b6d0d20` ; étiquette `v0.2.9` ; publication `v0.2.9` immuable « Latest » avec `courrier-v0_2_9.tar.gz` |
| Constats | La question de FAQ d'essai créée à la main reste active sur l'instance d'acceptance (« Que faire d'une enveloppe abîmée ? (essai) ») ; GitHub ne rappelle plus l'alerte Dependabot n° 29 (E38) ; annonce de GitHub : double authentification obligatoire après le 12/12/2026 |
| Incidents de procédure | Deux commandes PowerShell tapées dans la session SSH puis une phrase terminée par un point copiée dans une commande (`-3.`) : refusées sans effet ; commande de recette lancée avant d'avoir renseigné l'adresse : sans effet |

## 5. Version 0.2.8, déployée le 17/11/2026, non publiée, remplacée par la 0.2.9

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_8.tar.gz`, 2 880 241 octets, même taille sur NIXUS (déposée par File Station) ; SHA-256 `f0075b6be949f678b484b3f23a6fc901ced8c4652fa245ecf3f69f4c81baca26` |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 43 sauvegardes conservées.` à 12:24:22 |
| Construction | `docker compose build` sans `--no-cache` : 30 étapes sur 30, sans erreur ; 12:25:17 à 12:28:03, soit 2 min 46 s (164,6 s) ; contexte du frontend 2,80 Mo (captures) |
| Migration et démarrage | `[DB] Migration 008_faq_locale appliquée`, `[APP] API 0.2.8 sur le port 3001` ; `courrier-api Healthy` en 61,6 s, `courrier-web Started` en 52,9 s ; les deux conteneurs `(healthy)` |
| Version | `{"data":{"version":"0.2.8"},"meta":{"envelope":1,"version":"0.2.8"}}` |
| Recette à la main | Conformes : `v0.2.8` et courriers conservés ; panneau du registre avec capture annotée, trois repères numérotés, marge des puces ; `/help#help-register` ; néerlandais ; `/help` sans redirection (nginx) ; FAQ : fenêtre d'ajout avec cinq champs expliqués, enregistrement, affichage dans le panneau du registre. Remarques de Chrome : « No issues detected » sur Enregistrer un courrier, Utilisateurs › Créer, Paramètres et Tickets › Signaler ; 1 erreur sur Services › Nouveau service |
| Script de recette (PC du conducteur, Node v24.11.1, Chrome du poste) | 16 contrôles conformes sur 21 : version, panneau, marges, nginx (HTTP 200 pour `/help` et l'image JPEG), néerlandais, FAQ (création, correction, retrait sans suppression, disparition du panneau), clés brutes, parcours avec `#` (14 puis 9 fiches). En échec : image de « Créer un compte » (mauvaise procédure, corrigée en 0.2.9), Contacts › Nouveau contact (2 champs sans identifiant ni nom), Services › Nouveau service (`for="entity_ids"`), Entités et registres (aucun bouton « Modifier » : erreur de l'aide, corrigée en 0.2.9), Registre › fiche d'un courrier (3 champs sans identifiant ni nom) |
| Dépôt GitHub | Non publiée : remplacée par la 0.2.9 |
| Incidents de procédure | Mes fichiers de travail ont été réinitialisés entre deux sessions : reconstruits à partir de l'archive livrée, identique à celle installée (même taille) ; Claude ne peut pas atteindre l'adresse interne de NIXUS |

## 6. Version 0.2.7, déployée, recettée et publiée le 03/11/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_7.tar.gz`, 1 373 653 octets, identique au fichier livré ; même taille sur NIXUS ; SHA-256 `0876e9f5376f77326f7071d0d25c8e73b34a6471ff89528bd05d796e1b37d646` identique sur le PC (dans `Téléchargements`), sur GitHub et dans l'archive de Claude |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 33 sauvegardes conservées.` à 16:10:43 |
| Construction | `docker compose build` sans `--no-cache` : 30 étapes sur 30, sans erreur ; 16:12:27 à 16:16:50, soit 4 min 23 s (260,7 s) |
| Démarrage | Aucune migration ; `[APP] API 0.2.7 sur le port 3001` ; `courrier-api Healthy` en 81,1 s, `courrier-web Started` en 66,2 s ; les deux conteneurs `(healthy)` |
| Version | `{"data":{"version":"0.2.7"},"meta":{"envelope":1,"version":"0.2.7"}}` |
| Liste de contrôle à l'écran | 10 points sur 10 conformes : `v0.2.7`, bouton « Aide » à gauche de « Signaler » ; panneau « Mode d'emploi et FAQ » du registre (étiquettes de rôle, zones, quatre procédures, quatre questions) ; procédure « Retrouver un courrier » dépliée avec « Résultat » et « Si ça ne marche pas » ; « Mode d'emploi complet » mène à `/help#help-register` ; parcours « Administrateur » (neuf fiches) puis « Secrétariat » (sept fiches) ; recherche « recommandé » et « zzzzzz » ; impression ; explications de champs ; néerlandais. Les points 7, 8 et 10 sont confirmés oralement, sans capture |
| Remarques de Chrome (E23) | Sur « Enregistrer un courrier » : 4 remarques « No label associated with a form field » ; plus aucune « autocomplete » ni « id or name » |
| Défauts constatés | Clé brute `{{nav.registration}}` dans une question de la fiche « À enregistrer » ; puces des zones collées au bord ; choix « Parcours » écrasé quand l'adresse porte `#help-…` ; tous corrigés en 0.2.8 |
| Dépôt GitHub | Branche `version/v0.2.7` (commit `ea9cf42`, 56 fichiers : 23 `A`, 33 `M`, aucun `D`), demande de fusion n° 6, travail « tests » réussi, fusion `11ac1a6`, branche supprimée, étiquette `v0.2.7`, publication `v0.2.7` immuable « Latest » avec `courrier-v0_2_7.tar.gz` |
| Constats | Alerte Dependabot n° 29 (1 modérée) toujours signalée à l'envoi, non examinée (E38) |
| Incidents de procédure | Une sortie de commande (« Started 66.2s ») collée dans le terminal : refusée par le NAS, sans effet |

## 7. Version 0.2.6, déployée, recettée et publiée le 03/11/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_6.tar.gz`, 1 330 433 octets, identique au fichier livré ; même taille sur NIXUS ; SHA-256 `a28451656f36fc5afa5917a2e932ef0d011e8d8c2d5379019e1b210353ebf313` identique sur le PC (après copie vers `Téléchargements`), sur GitHub et dans l'archive de Claude |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 32 sauvegardes conservées.` à 14:34:48 |
| Construction | `docker compose build` sans `--no-cache` : 30 étapes sur 30, sans erreur ; 14:35:55 à 14:49:09, soit 13 min 14 s (789 s) ; images de base lentes à charger (20 à 38 s) |
| Migration et démarrage | `[DB] Migration 007_tickets appliquée`, `[APP] API 0.2.6 sur le port 3001` ; `courrier-api Healthy` en 129,4 s, `courrier-web Started` en 116,8 s ; les deux conteneurs `(healthy)` |
| Version | `{"data":{"version":"0.2.6"},"meta":{"envelope":1,"version":"0.2.6"}}` |
| Liste de contrôle à l'écran | 8 points sur 8 conformes : `v0.2.6`, bouton « Signaler » dans l'en-tête, « Tickets » dans le groupe Aide, courriers conservés ; sur le registre, fenêtre « Signaler » sans champ de capture et message « Aucune capture sur cet écran… » ; `TCK-2026-00001` (question métier, file « Métier », entité AC) ; sur Contacts, champ « Capture d'écran (facultative) » avec avertissement, `TCK-2026-00002` (incident, file IT) ; écran Tickets avec les deux tickets (compteurs : en cours 1, sans responsable 1 : seule la file IT compte pour l'administrateur) et tiroir de détail ; contexte technique sans donnée de courrier ; carte « Tickets » dans Paramètres (rôles, délais 1 et 8, 4 et 24, 8 et 72, 24 et 240, réouverture 14 jours) ; néerlandais conforme (« Melden », « Rollen van de functionele wachtrij ») |
| Non joué sur NIXUS | La file métier avec un gestionnaire du registre : aucun compte de l'instance n'a ce rôle ; couverte par les tests et par le parcours réel dans Chromium |
| Dépôt GitHub | Branche `version/v0.2.6` (commit `0305ccc`, 43 fichiers : 11 `A`, 32 `M`, aucun `D`), demande de fusion n° 5, travail « tests » réussi en 2 min, fusion `4871a46`, branche supprimée, étiquette `v0.2.6`, publication `v0.2.6` immuable « Latest » avec `courrier-v0_2_6.tar.gz` |
| Constats | À l'envoi, GitHub signale une alerte Dependabot n° 29 (1 modérée, branche principale), non examinée (E38) |
| Incidents de procédure | Archive rangée par le navigateur dans un dossier OneDrive (`files1427`) : retrouvée par `Get-ChildItem`, copiée dans `Téléchargements`, empreinte vérifiée avant l'extraction (règle 9) |

## 8. Version 0.2.5, déployée, recettée et publiée le 03/11/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_5.tar.gz`, 1 298 063 octets, identique au fichier livré ; même taille sur NIXUS ; SHA-256 `e9d5f5f55f5bd54ed4fad3564d90ce8e190361c29fc45d18a19741168e6e6ba6` identique sur le PC, sur GitHub et dans l'archive de Claude |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 31 sauvegardes conservées.` à 12:11:48 |
| Construction | `docker compose build --no-cache` : 30 étapes sur 30, sans erreur ; 12:13:05 à 12:20:19, soit 7 min 14 s (426,4 s) |
| Migration et démarrage | `[DB] Migration 006_connexion_microsoft appliquée`, `[APP] API 0.2.5 sur le port 3001` ; `courrier-api Healthy` en 96,7 s, `courrier-web Started` en 68,1 s ; les deux conteneurs `(healthy)` |
| Version | `{"data":{"version":"0.2.5"},"meta":{"envelope":1,"version":"0.2.5"}}` |
| Liste de contrôle à l'écran | 6 points sur 6 conformes : `v0.2.5` au bas du menu, `AC-2026-000001` à `AC-2026-000006` conservés ; connexion locale inchangée, message « Vous êtes déconnecté. » sur `/login?deconnecte=1` sans reconnexion automatique ; carte « Connexion » dans Paramètres avec explication de chaque champ ; « Tester l'annuaire » sans saisie : « Saisissez d'abord l'annuaire (locataire), puis relancez le test. » ; colonne « Accès de secours » activée pour les deux administrateurs actifs ; néerlandais conforme (« Aanmelden », « Directory testen », « Noodtoegang »). Le septième point (mode « Microsoft obligatoire ») n'a pas été joué : pas d'inscription Entra ID |
| Recette réelle en 7 points | Non jouable avant l'inscription d'application Entra ID et le lien dans Portal |
| Dépôt GitHub | Branche `version/v0.2.5` (commit `bfa1dbe`, 43 fichiers : 12 `A`, 31 `M`, aucun `D`), demande de fusion n° 4, travail « tests » réussi en 1 min, fusion `2d7bb87`, branche supprimée, étiquette `v0.2.5`, publication `v0.2.5` immuable « Latest » avec `courrier-v0_2_5.tar.gz` |
| Constats | Code scanning : 10 alertes ouvertes, toutes sur `pieces.js` (E25), 1 fermée (`ci.yml`, E28) |
| Incidents de procédure | `cd C:\dev\...` tapé dans la session SSH de NIXUS : sans effet, règle 9 ajoutée ; archive rangée par le navigateur dans un dossier OneDrive et non dans `Téléchargements` : copiée avant la section 5 |

## 9. Version 0.2.4, déployée, recettée et publiée le 27/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_4.tar.gz`, 1 264 765 octets, identique au fichier livré ; même taille sur NIXUS |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 23 sauvegardes conservées.` à 16:25:34 |
| Construction | `docker compose build` sans `--no-cache` : 30 étapes sur 30, sans erreur ; 16:26:22 à 16:27:53, soit 1 min 31 s (91,3 s) ; la connexion SSH s'est réinitialisée juste après le retour de l'invite, sans effet |
| Démarrage | `courrier-api Healthy` en 42,3 s, `courrier-web Started` en 40,8 s ; les deux conteneurs `(healthy)` |
| Version et compte | `{"data":{"version":"0.2.4"},"meta":{"envelope":1,"version":"0.2.4"}}` ; `id -u` = `10001` |
| Liste de contrôle à l'écran | 5 points sur 5 conformes : `v0.2.4` au bas du menu, courriers `AC-2026-000001` à `AC-2026-000005` conservés ; champ « Reçu le » à `27/10/2026`, calendrier français (« oct. 2026 », « lu ma me je ve sa di », bouton « Aujourd'hui ») ; `Pièce fictive.pdf` resté dans la file, enregistré en `AC-2026-000006` ; nom du fichier intact dans la fiche (« è » correct) ; en néerlandais `27-10-2026`, calendrier en néerlandais (« okt 2026 », « ma di wo do vr za zo »), langue remise en FR. Le champ « Langue du courrier » du formulaire était resté sur « Néerlandais » : valeur reprise du dernier courrier, sans effet |
| Dépôt GitHub | Branche `version/v0.2.4` (commit `8cbd53c`), demande de fusion #3, travail « tests » réussi en 49 s, fusion `0415b2f`, branche supprimée, étiquette `v0.2.4`, publication `v0.2.4` immuable « Latest » avec `courrier-v0_2_4.tar.gz` ; empreinte SHA-256 `e79cdfaa6f087dbe88f3d8e50633def06ca5845dd61f57ca6dccf8ad4b4cfaf5` identique sur le PC et sur GitHub (début relevé à l'écran) |
| Constats | Demandes de fusion ouvertes : 0 (3 fermées dont #1 et #2 de Dependabot) ; alertes Dependabot : 28 fermées, 0 ouverte ; Code scanning : 11 ouvertes, soit les 10 de `pieces.js` (E25) et une nouvelle « Workflow does not contain permissions » (gravité moyenne, `ci.yml` ligne 8, E28) |

## 10. Version 0.2.3, déployée le 27/10/2026, défaut relevé à la recette, remplacée par la 0.2.4

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_3.tar.gz`, 1 261 418 octets, identique au fichier livré ; même taille sur NIXUS |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 22 sauvegardes conservées.` à 15:44:46 |
| Construction | `docker compose build --no-cache` : 30 étapes sur 30, sans erreur ; 15:45:58 à 15:49:12, soit 3 min 14 s (194,0 s) ; `npm ci` de l'interface sous npm 10 a relu le verrou écrit par npm 11 ; `npm run build` en 43,5 s |
| Démarrage | `courrier-api Healthy` en 92,7 s, `courrier-web Started` en 83,5 s ; les deux conteneurs `(healthy)` après environ 1 min 30 |
| Version et compte | `{"data":{"version":"0.2.3"},"meta":{"envelope":1,"version":"0.2.3"}}` ; `id -u` = `10001` |
| Liste de contrôle à l'écran | `v0.2.3` au bas du menu ; `AC-2026-000001` à `AC-2026-000005` conservés avec leurs trombones ; fiche de `AC-2026-000004` avec ses deux fichiers lisibles ; TIFF refusé avec sa raison ; dépôt de `Pièce fictive.pdf` : aperçu et formulaire affichés. Non conforme : sélecteur de date de « Enregistrer ce fichier » en anglais et au format `10/27/2026`. Contrôle interrompu, corrigé en 0.2.4 |
| Dépôt GitHub | Non publiée : le défaut a été relevé avant l'envoi |
| Fichier laissé dans la file | `Pièce fictive.pdf` déposé pendant la recette, non enregistré : il reste dans la file « À enregistrer » de l'entité AC |

## 11. Version 0.2.2, déployée et recettée le 27/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_2.tar.gz`, 1 271 020 octets, identique au fichier livré ; même taille sur NIXUS |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 20 sauvegardes conservées.` à 14:05:09 (ancien script) |
| Construction | `docker compose build` : 30 étapes sur 30, sans erreur ; 14:06:06 à 14:08:11, soit 2 min 5 s (124,3 s) ; `npm ci` rejoué, création d'`appuser` et `openssl` réutilisés |
| Démarrage | `courrier-api Healthy` en 47,6 s, `courrier-web Started` en 42,6 s ; `courrier-web` `(healthy)` après environ 1 min 30 (les contrôles lancés avant ce délai affichaient `health: starting`) |
| Version | `{"data":{"version":"0.2.2"},"meta":{"envelope":1,"version":"0.2.2"}}` |
| Dossier des sauvegardes | Seconde sauvegarde avec le nouveau `backup.sh` à 14:11:02 : `21 sauvegardes conservées` ; `sudo ls -t /srv/backups/courrier` : `courrier-20261027-1411`, `-1405`, `-0200`. Même dossier qu'avant. Sans `sudo`, `ls` répond `Permission denied` (dossier de root) : la commande des notes de la 0.2.2 est à corriger dans la 0.2.3 |
| Liste de contrôle à l'écran | 3 points sur 3 conformes : `v0.2.2` au bas du menu ; `AC-2026-000001` (annulé) à `AC-2026-000005` présents avec leurs trombones (1, 2, 1, 1) ; fiche de `AC-2026-000004` avec ses deux fichiers lisibles ; écran « À enregistrer » affiché, file vide. Registre du CPAS et `id -u` non contrôlés |
| Dépôt GitHub | Dépôt créé à la main le 27/10/2026 dans l'organisation (public, description « Exercice de formation, non destiné à la production ») ; l'option « Add README » avait été activée à la création, d'où un premier commit `fddd7e0` écrasé par `git push -u origin main --force` (commit `fa27fa9`, 139 fichiers) ; étiquette `v0.2.2` poussée ; travail « tests » #1 vert en 1 min 47 s ; publication `v0.2.2` immuable (« Latest ») avec `courrier-v0_2_2.tar.gz`, empreinte `sha256:b9597d1e822c…` |
| Constats | Dependabot a ouvert deux demandes de fusion (#1 `@vitest/mocker` et `vitest`, #2 `vite`) et CodeQL s'est configuré tout seul ; l'onglet « Security and quality » affiche 38 signalements : 0 secret, 28 Dependabot (10 hautes sur `multer`, 15 sur `vite`, `launch-editor`, `vitest`, `esbuild`), 10 CodeQL sur `pieces.js` ; rien n'est fermé |
| Protection de `main` | Règle `protection-main` créée et active : demande de fusion, travail « tests » obligatoire, suppression et `--force` interdits, liste de contournement vide, cible `main` |

## 12. Version 0.2.1, déployée le 20/10/2026, recettée le 27/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_1.tar.gz`, 1 439 023 octets, identique au fichier livré |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 12 sauvegardes conservées.` à 19:24:52 |
| Construction | `docker compose build` : 30 étapes sur 30, sans erreur ; 19:27:09 à 19:32:30, soit 5 min 21 s (315,2 s). Les `npm ci` sont rejoués parce que le numéro de version change `package.json` ; création d'`appuser` et `openssl` réutilisés |
| Démarrage | `courrier-api Healthy` en 63,0 s, `courrier-web Started` en 54,9 s |
| Version et compte | `{"data":{"version":"0.2.1"},"meta":{"envelope":1,"version":"0.2.1"}}` ; `id -u` = `10001` |
| Liste de contrôle à l'écran (27/10/2026) | 6 points sur 6 conformes : version et données conservées ; TIFF glissé refusé avec « Fichier TIFF refusé : réglez le copieur pour produire des PDF. » ; enregistrement depuis la file (`AC-2026-000004`, puis `AC-2026-000005`) et grande barre verte effacée au dépôt suivant ; trombone de `AC-2026-000004` passé à « 2 » sans rechargement ; onglet « Issues » de Chrome à 0 erreur et 0 avertissement (20 remarques d'information, écart E23) ; mention « Valeur livrée » présente après enregistrement |

## 13. Version 0.2.0, déployée le 20/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_2_0.tar.gz`, 1 432 687 octets, identique au fichier livré |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 10 sauvegardes conservées.` à 15:34:59 |
| Construction | `docker compose build --no-cache` : 30 étapes sur 30, sans erreur ; 15:36:44 à 15:48:03, soit 11 min 19 s (673,5 s) ; étape `addgroup ... appuser` passée ; interface construite en 107,1 s |
| Arrêt du serveur | `Container courrier-api Stopped` |
| Propriétaire du volume | `chown -R 10001:10001 /app/data` sans message ; `ls -ln` : `app.db` (184 320 octets) en `10001 10001` |
| Démarrage | `courrier-api Healthy` en 90,9 s, `courrier-web Started` en 92,6 s ; deux conteneurs `Up (healthy)` ; ports 8450 et 8090 inchangés |
| Version et compte | `{"data":{"version":"0.2.0"},"meta":{"envelope":1,"version":"0.2.0"}}` ; `id -u` = `10001` |
| Journal du serveur | `[DB] Migration 005_pieces_consultations appliquée`, `[APP] API 0.2.0 sur le port 3001`, aucune erreur |
| Fichiers dans la sauvegarde | `sauvegarde terminée, 11 sauvegardes conservées.` à 16:01:11 ; `data/pieces/2026/10/b801c9216d262cec1c316f9a098d930b.pdf` présent dans l'archive |
| Liste de contrôle à l'écran | 12 points conformes sur 13 : version et menus, données conservées, aperçu PDF lisible dans Chrome, enregistrement depuis la file (`AC-2026-000003`), rejet avec motif, registre et fiche (téléchargement de 668 octets, identique), ajout d'un fichier à `AC-2026-000002`, journal de l'auditeur, taille maximale réglable (refus à 1 Mo), néerlandais, thème sombre, affichage étroit (501 px). Non conforme : point 5 (TIFF écarté sans message). Relevé en marge du point 8 : trombone du registre non mis à jour sans F5. Console : huit signalements d'étiquettes. Corrigés en 0.2.1 |
| Comptes | « Test Auditeur » (AC · Auditeur) créé pour le point 9, puis désactivé ; son mot de passe est passé dans la conversation |

## 14. Version 0.1.1, déployée le 20/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Archive | `courrier-v0_1_1.tar.gz`, 1 045 070 octets, identique au fichier livré |
| Sauvegarde avant mise à jour | `sauvegarde terminée, 9 sauvegardes conservées` à 11:25:37 : la tâche quotidienne tourne depuis le 14/10/2026 |
| Construction | 28 étapes sur 28, sans erreur ; 11:27:30 à 11:39:51, soit 12 min 21 s (739,8 s) ; interface construite en 133 s |
| Script d'atelier | `2 paramètres, 0 services, 0 types, 0 contacts ajoutés ; 21 services mis à jour` |
| Démarrage | `courrier-api Healthy` en 136,4 s, `courrier-web Started` |
| État | Deux conteneurs `Up (healthy)`, recréés |
| Version | `{"data":{"version":"0.1.1"},"meta":{"envelope":1,"version":"0.1.1"}}` |
| Liste de contrôle à l'écran | 8 points sur 8 conformes : onglet « Courrier » et « Briefwisseling », nom de l'administration sur deux lignes, v0.1.1, cadre « Entités », services sans « NL à valider » avec RD et SCAD renommés, seul « Fermer » après création d'un compte, menu mis à jour sans F5, « Inkomende post » entier, données conservées |
| Comptes | « Version Essai » créé pour le test, puis désactivé |

## 15. Version 0.1.0, installée le 13/10/2026

| Étape | Résultat relevé |
| --- | --- |
| Ports | 8450 et 8090 libres côté Docker et côté hôte (contrôle manuel puis `verifier-ports.sh`) |
| `.env` | Sept variables créées par commande, droits 600 |
| Construction | 28 étapes sur 28 ; 16:25:31 à 16:34:11, soit 8 min 40 s (514,6 s) |
| Script d'atelier | Réseau et volumes créés ; migrations 001 à 004 ; entités et registres de référence ; `2 paramètres, 24 services, 15 types, 6 contacts ajoutés` |
| Démarrage | `courrier-api Healthy` en 35,9 s, `courrier-web Started` |
| Version et compte du serveur | `0.1.0` ; `id -u` = 1000 |
| Premier administrateur | Créé par l'écran d'installation ; rôle AC · Secrétariat ajouté ensuite |
| Liste de contrôle à l'écran | Enregistrement `AC-2026-000001`, recherche, fiche, annulation avec motif, `AC-2026-000002` avec nouveau contact, cloisonnement (compte CPAS sans accès à l'AC), néerlandais et `CPAS-2026-000001`, affichage mobile : tout conforme |
| Sauvegarde | Tâche DSM « Sauvegarde courrier » créée, quotidienne à 02:00, utilisateur root ; premier lancement manuel « Normal (0) », fichier `courrier-20261013-1715.tar.gz` de 9 423 octets |
| Défauts relevés | Six défauts d'affichage, corrigés en 0.1.1 |
| Comptes | « CPAS Test » créé pour le cloisonnement, désactivé ensuite |
| Constats hors application | Notification par courriel de DSM en panne (jeton Gmail) ; tâches de PILOT désactivées dans le Planificateur, laissées telles quelles |
