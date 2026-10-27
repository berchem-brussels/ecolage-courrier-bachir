# Courrier

Application de gestion du courrier entrant et sortant de l'Administration communale et du CPAS. Elle remplace l'outil du marché utilisé jusqu'ici. Version 0.2.2 du 27/10/2026, au « Standard des applications communales v3.2 » (document interne, absent de ce dépôt), construite sur le gabarit v3 1.1.0. Licence EUPL-1.2.

Les versions 0.1.0 et 0.1.1 forment l'étape 1 du planning : enregistrement et numérotation du courrier entrant, registre, contacts, services, types de courrier, entités et registres, rôles par entité. La version 0.2.0 est l'étape 2, corrigée en 0.2.1 après sa recette. La version 0.2.2 prépare ce dépôt public sans changer le fonctionnement : fichiers du courrier (file « À enregistrer », aperçu, fiche), journal des consultations, paramètres de l'instance. Les étapes suivantes sont décrites dans `ETAT.md`.

## Structure

| Partie | Fichiers |
| --- | --- |
| Base de données | `backend/src/database.js` : couche `prepare()` de SAGA, migrations 001 à 005, chargement des entités et registres de référence depuis `backend/config/registres.defaut.json` |
| Droits | `backend/src/rights.js` : rôles par entité, rôle global d'administration sans accès au contenu du courrier |
| Services métier | `backend/src/services/` : une fonction par opération, appelée par la route et par l'outil MCP |
| API | `backend/src/routes/crud.js` (cinq routes par ressource), `routes/resources.js` (montage des six ressources), `routes/pieces.js` (dépôt multipart et contenu des fichiers), `routes/consultations.js`, `routes/settings.js` |
| Fichiers | `backend/src/services/pieces.js` : contrôle du type réel, stockage sous un nom généré dans `/app/data/pieces`, rattachement, rejet, lecture journalisée |
| MCP | `backend/src/mcp.js` : 52 outils exposés, annulation et rejet en deux appels |
| Données d'atelier | `backend/scripts/donnees-atelier.js`, `backend/instance/` (le fichier d'une instance réelle, `atelier.json`, est exclu du dépôt ; `atelier.exemple.json` en donne la forme) |
| Interface | `frontend/src/pages/` : registre, file « À enregistrer », enregistrement, contacts, journal des consultations, services, types, entités et registres, paramètres, utilisateurs |
| Documentation | `docs/` : architecture en FR, NL et EN, sécurité, fiches fonctionnelles, journal des déploiements, captures, fichiers d'essai fictifs (`docs/essais/`) |

## Développement

```bash
cd backend && npm ci && npm run dev
```

```bash
cd frontend && npm ci && npm run dev
```

Au premier lancement, l'écran d'installation crée le premier administrateur. L'administrateur règle les comptes et leurs rôles par entité ; il ne voit pas le contenu du courrier sans rôle de secrétariat ou de gestionnaire.

## Tests

| Commande | Décompte au 20/10/2026 |
| --- | --- |
| `cd backend && npm test` | 77 tests, 0 échec |
| `cd frontend && npm test` | 58 tests, 0 échec |
| `cd frontend && npm run build` | 0 erreur |
| `cd frontend && npm run a11y` | 0 erreur |

Chaque demande de fusion et chaque poussée sur `main` rejouent ces suites et l'audit des dépendances de production par GitHub Actions (`.github/workflows/ci.yml`, travail « tests »).

Décomptes relevés sous Node 22.22.2 dans le bac à sable de Claude ; les images utilisent Node 20.

## Installation et mise à jour

La première installation est décrite dans `NOTES_LIVRAISON_v0.1.0.md`, la mise à jour vers la 0.2.0 dans `NOTES_LIVRAISON_v0.2.0.md`, vers la 0.2.1 dans `NOTES_LIVRAISON_v0.2.1.md`, vers la 0.2.2 dans `NOTES_LIVRAISON_v0.2.2.md`, le journal des déploiements dans `docs/APRES-DEPLOIEMENT.md`. Les adresses, ports et dossiers de ces documents sont des valeurs d'exemple ; ceux du serveur d'acceptance ne figurent pas dans ce dépôt. Exemple : dossier `/srv/docker/courrier`, conteneurs `courrier-api` et `courrier-web`, ports 8450 (HTTPS) et 8090 (HTTP redirigé).

## Variables du fichier .env

| Variable | Rôle |
| --- | --- |
| `APP_NAME` | Nom du projet Compose et préfixe des conteneurs |
| `HTTPS_PORT`, `HTTP_PORT` | Ports publiés |
| `PUBLIC_HOST` | Adresse du serveur pour le certificat et la redirection |
| `APP_ENVIRONMENT` | `acceptance` ou `production` ; les données fictives sont refusées en production |
| `JWT_SECRET`, `CONFIG_ENC_KEY` | Secrets générés à l'installation, jamais recopiés ailleurs |
