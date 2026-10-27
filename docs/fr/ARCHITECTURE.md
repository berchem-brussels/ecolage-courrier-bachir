# Architecture, version 0.2.0

Le français fait foi. Les versions néerlandaise et anglaise sont des traductions de Claude à faire relire (écart E13).

## Services

Deux conteneurs Docker Compose : `courrier-web` (nginx, interface construite, relais `/api/`, HTTPS) et `courrier-api` (Express 4, port interne 3001, non publié, utilisateur `appuser` 10001 depuis la 0.2.0). Base `sql.js` et fichiers déposés dans le volume `db-data`, monté sur `/app/data` ; PostgreSQL 16 à l'étape 8.

| Chemin dans le volume | Contenu |
| --- | --- |
| `/app/data/app.db` | Base `sql.js` |
| `/app/data/pieces/AAAA/MM/<32 caractères hexadécimaux>.<pdf, jpg ou png>` | Fichiers déposés, sous un nom généré par le serveur |
| `/app/data/pieces/tmp/` | Fichiers en cours de réception ; effacés à la fin de chaque envoi et, pour un envoi interrompu, après une heure |

`backup.sh` archive `/app/data` entier : la base et les fichiers déposés.

## Tables

| Table | Contenu |
| --- | --- |
| `users`, `sessions`, `audit_log`, `app_settings` | Socle du gabarit ; `users` porte l'auteur de création et de modification ; `app_settings` porte les paramètres de l'instance qui priment sur les défauts |
| `entities` | Entités (code, nom FR et NL) |
| `registers` | Registres d'entrée et de départ par entité : préfixe, nombre de chiffres |
| `register_counters` | Dernier numéro par registre et par année |
| `user_roles` | Un rôle par personne et par entité |
| `org_services`, `org_service_entities` | Services destinataires, rattachés à une ou plusieurs entités, service parent |
| `mail_types` | Types de courrier par entité |
| `contacts` | Expéditeurs et destinataires |
| `mails` | Courrier entrant : numéro unique, registre, année, rang, date de réception, expéditeur, objet, type, statut |
| `pieces` (0.2.0) | Fichier déposé : entité, courrier (après rattachement), statut `a_enregistrer`, `rattachee` ou `rejetee`, nom de stockage, nom d'origine, type vérifié, taille, empreinte SHA-256, position, motif de rejet |
| `consultations` (0.2.0) | Journal des consultations : personne, entité, courrier, pièce, action (`fiche` ou `piece`), canal (`api` ou `mcp`), horodatage UTC |

Migrations : `001_noyau`, `002_entites_registres`, `003_referentiels`, `004_courrier_entrant`, `005_pieces_consultations`.

## Rôles

| Rôle | Portée | Droits dans la version 0.2.0 |
| --- | --- | --- |
| `admin` (global) | Application | Comptes, rôles, entités, registres, services, types, paramètres ; aucun accès au contenu du courrier ni aux fichiers |
| `secretariat` | Entité | Enregistre, consulte, corrige et annule le courrier de son entité ; dépose, consulte et rejette les fichiers de la file ; ajoute un fichier à un courrier ; contacts |
| `gestionnaire` | Entité | Comme le secrétariat, plus les types de courrier de son entité |
| `auditeur` | Entité | Journal des consultations de son entité, sans contenu du courrier |
| `agent`, `chef_service` | Entité | Aucun accès au courrier avant l'étape 3 |

## Pièces

Le dépôt arrive en `multipart/form-data` (champ `file`) par `multer` 1.4.5-lts.2, un fichier par envoi. La session et le jeton anti-CSRF sont contrôlés avant la réception. Le service contrôle ensuite, dans cet ordre : le droit sur l'entité ou le courrier, le statut du courrier, la taille (paramètre `pieces.max_mb`), le type réel sur les premiers octets (PDF `%PDF-`, JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A` ; TIFF refusé avec sa raison propre). Le fichier est ensuite déplacé sous un nom généré, son empreinte est calculée et la ligne est écrite. Le nom d'origine, relu en UTF-8 (`multer` 1.x le lit en latin-1), sert uniquement à l'affichage.

L'enregistrement d'un courrier reçoit `piece_ids` : dans la même transaction que l'attribution du numéro, chaque pièce passe de `a_enregistrer` à `rattachee`. Une pièce déjà prise, rejetée ou d'une autre entité annule tout l'enregistrement, sans numéro consommé.

Le contenu se lit par `GET /api/pieces/:id/contenu`, authentifié par le cookie de session. C'est la seule réponse hors enveloppe avec le MCP et le contrat OpenAPI, puisqu'elle rend un fichier. En-têtes : `Content-Security-Policy: default-src 'none'; frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`, `Cache-Control: private, no-store`, `Content-Disposition: inline` (ou `attachment` avec `?telecharger=1`). nginx sert cette route dans un bloc propre, sans ses en-têtes de refus de cadre, pour que l'aperçu s'affiche dans l'application et nulle part ailleurs.

Toute lecture du contenu et toute ouverture de fiche (`GET /api/mails/:id`) s'inscrivent au journal des consultations. Chaque affichage de l'aperçu compte comme une lecture.

## Numérotation

À l'enregistrement, dans une transaction : création du compteur de l'année si besoin, incrément, lecture, insertion, rattachement des pièces. Format `<préfixe>-<année>-<rang sur N chiffres>`. L'année est celle de la date de réception. Un numéro annulé reste au registre et n'est jamais réutilisé. Le préfixe et le nombre de chiffres d'un registre se figent au premier numéro attribué.

## Paramètres

| Clé | Défaut | Où |
| --- | --- | --- |
| `app.name_fr`, `app.name_nl` | Courrier, Briefwisseling | `config/instance.defaut.json` |
| `app.organisation_fr`, `app.organisation_nl` | Pouvoir local, Lokaal bestuur | Idem, surchargé par `app_settings` |
| `app.timezone` | Europe/Brussels | Idem ; sert à la date du jour et aux filtres de période du journal |
| `pieces.max_mb` | 50 | Idem ; modifiable dans Administration › Paramètres, de 1 à 50 (plafond de `client_max_body_size` de nginx, 51 Mo) |
| `pieces.mcp_read_max_mb` | 5 | Idem ; de 1 à 10 |
| Entités et registres | AC, CPAS, préfixes AC, D-AC, CPAS, D-CPAS, 6 chiffres | `config/registres.defaut.json`, chargé dans une base vide |

## API et MCP

| Ressource | Routes | Outils MCP |
| --- | --- | --- |
| `/api/mails`, `/api/contacts`, `/api/mail-types`, `/api/services`, `/api/entities`, `/api/registers` | Cinq routes chacune | `list_`, `get_`, `create_`, `update_`, `prepare_cancel_`, `confirm_cancel_` |
| `/api/pieces` | `GET /`, `GET /:id`, `GET /:id/contenu`, `POST /` (multipart), `PUT /:id`, `DELETE /:id` (rejet avec motif) | `list_pieces`, `get_piece`, `read_piece_content`, `create_piece` (base64, environ 190 ko au plus à cause de la limite de 256 ko du corps JSON), `update_piece`, `prepare_reject_piece`, `confirm_reject_piece` |
| `/api/consultations` | `GET /` seulement : le journal ne s'écrit que par l'application | `list_consultations` |
| `/api/settings` | `GET /`, `PUT /` (ressource unique) | `get_settings`, `update_settings` |
| `/api/users` | Cinq routes | `list_users`, `get_user`, `create_user`, `update_user`, `prepare_deactivate_user`, `confirm_deactivate_user` |

55 routes au total, 52 outils MCP exposés. Contrat OpenAPI généré sur `GET /api/openapi.json` ; le dépôt y est décrit en `multipart/form-data`.
