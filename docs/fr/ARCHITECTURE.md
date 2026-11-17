# Architecture, version 0.2.9

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

Migrations : `001_noyau`, `002_entites_registres`, `003_referentiels`, `004_courrier_entrant`, `005_pieces_consultations`, `007_tickets` (0.2.6 : tables `tickets` et `ticket_messages`), `006_connexion_microsoft` (0.2.5 : `users.oid`, `users.is_admin_local`, table `auth_pending` des connexions Microsoft en cours, dix minutes).

## Rôles

| Rôle | Portée | Droits dans la version 0.2.0 |
| --- | --- | --- |
| `admin` (global) | Application | Comptes, rôles, entités, registres, services, types, paramètres ; aucun accès au contenu du courrier ni aux fichiers |
| `secretariat` | Entité | Enregistre, consulte, corrige et annule le courrier de son entité ; dépose, consulte et rejette les fichiers de la file ; ajoute un fichier à un courrier ; contacts |
| `gestionnaire` | Entité | Comme le secrétariat, plus les types de courrier de son entité |
| `auditeur` | Entité | Journal des consultations de son entité, sans contenu du courrier |
| `agent`, `chef_service` | Entité | Aucun accès au courrier avant l'étape 3 |

## Pièces

Le dépôt arrive en `multipart/form-data` (champ `file`) par `multer` 2.5.0, un fichier par envoi. La session et le jeton anti-CSRF sont contrôlés avant la réception. Le service contrôle ensuite, dans cet ordre : le droit sur l'entité ou le courrier, le statut du courrier, la taille (paramètre `pieces.max_mb`), le type réel sur les premiers octets (PDF `%PDF-`, JPEG `FF D8 FF`, PNG `89 50 4E 47 0D 0A 1A 0A` ; TIFF refusé avec sa raison propre). Le fichier est ensuite déplacé sous un nom généré, son empreinte est calculée et la ligne est écrite. Le nom d'origine, relu en UTF-8 (`multer` 1.x le lit en latin-1), sert uniquement à l'affichage.

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
| `tickets.sla_json` (0.2.6) | P1 1 h et 8 h, P2 4 h et 24 h, P3 8 h et 72 h, P4 24 h et 240 h | `app_settings`, Administration › Paramètres › Tickets : heures [prise en charge, résolution] par priorité |
| `tickets.reopen_days` (0.2.6) | 14 | Idem : jours pendant lesquels le demandeur rouvre un ticket résolu |
| `tickets.business_roles`, `tickets.it_roles` (0.2.6) | `gestionnaire`, `admin` | Idem : codes de rôle de chaque file ; `admin` vaut pour toute l'application, les autres codes dans l'entité du ticket seulement |
| `auth.mode` (0.2.5) | `local` | `app_settings`, modifiable dans Administration › Paramètres › Connexion : `local`, `sso_optional`, `sso` |
| `auth.tenant`, `auth.client_id`, `auth.public_url`, `auth.domains` (0.2.5) | vide | Idem ; `auth.public_url` en HTTPS, sert à l'adresse de retour `<adresse>/api/auth/callback` |
| `auth.client_secret` (0.2.5) | vide | Idem ; chiffré AES-256-GCM (`CONFIG_ENC_KEY`), jamais renvoyé ni inscrit au journal ; absent des paramètres publics |
| Entités et registres | AC, CPAS, préfixes AC, D-AC, CPAS, D-CPAS, 6 chiffres | `config/registres.defaut.json`, chargé dans une base vide |

## API et MCP

| Ressource | Routes | Outils MCP |
| --- | --- | --- |
| `/api/mails`, `/api/contacts`, `/api/mail-types`, `/api/services`, `/api/entities`, `/api/registers` | Cinq routes chacune | `list_`, `get_`, `create_`, `update_`, `prepare_cancel_`, `confirm_cancel_` |
| `/api/pieces` | `GET /`, `GET /:id`, `GET /:id/contenu`, `POST /` (multipart), `PUT /:id`, `DELETE /:id` (rejet avec motif) | `list_pieces`, `get_piece`, `read_piece_content`, `create_piece` (base64, environ 190 ko au plus à cause de la limite de 256 ko du corps JSON), `update_piece`, `prepare_reject_piece`, `confirm_reject_piece` |
| `/api/consultations` | `GET /` seulement : le journal ne s'écrit que par l'application | `list_consultations` |
| `/api/settings` | `GET /`, `PUT /` (ressource unique) | `get_settings`, `update_settings` |
| `/api/users` | Cinq routes | `list_users`, `get_user`, `create_user`, `update_user`, `prepare_deactivate_user`, `confirm_deactivate_user` |

| `/api/auth/config`, `/api/auth/sso/start`, `/api/auth/callback` (0.2.5) | Trois routes libres, en liste écrite : état de la connexion, départ vers Microsoft, retour de Microsoft | Aucun : routes de navigation du navigateur |
| `/api/settings/auth` (0.2.5) | `GET`, `PUT`, `POST /test` : administrateur seul | Aucun : réglages de connexion réservés à l'écran |

| `/api/tickets` (0.2.6) | `GET /`, `GET /stats`, `GET /to-handle`, `GET /:id`, `GET /:id/screenshot`, `POST /`, `PUT /:id`, `POST /:id/status`, `POST /:id/messages` | `list_tickets`, `ticket_stats`, `list_tickets_to_handle`, `get_ticket`, `get_ticket_screenshot`, `create_ticket`, `update_ticket`, `prepare_change_ticket_status`, `confirm_change_ticket_status`, `add_ticket_message` |
| `/api/settings/tickets` (0.2.6) | `GET`, `PUT` : administrateur seul | `get_ticket_settings`, `update_ticket_settings` |

(72 routes et 64 outils MCP en 0.2.6) Contrat OpenAPI généré sur `GET /api/openapi.json` ; le dépôt y est décrit en `multipart/form-data`.

## Tickets (0.2.6)

Un ticket porte l'entité de son demandeur (`tickets.entity_id`) : celle de son seul rôle, ou celle qu'il choisit s'il a des rôles dans deux entités ; aucune pour l'administrateur seul. La file IT (incident, bug, souhait, et question sans entité) est traitée par les rôles de `tickets.it_roles` ; la file métier (question avec entité) par les rôles de `tickets.business_roles` tenus dans l'entité du ticket. L'administrateur n'a donc pas accès aux questions métier ni, par elles, au contenu du courrier. Le contexte joint (écran par son identifiant, version, langue, navigateur, date, dernière erreur de l'API) ne contient aucune donnée de courrier. Les écrans qui affichent du courrier n'acceptent aucune capture : `NO_CAPTURE_SCREENS` du serveur, repris par `frontend/src/screens.ts` (test d'alignement). Une capture de 2 Mo pèse environ 2,8 Mo en base64 : `express.json` à 4 Mo sur `/api/tickets` et bloc nginx de 4 Mo.

## Aide par écran (0.2.7)

Une fiche par écran dans `frontend/src/help/topics/`, au schéma `HelpTopic` (`help/types.ts`) : identifiant, adresse, groupe du menu, rôles, rôle de l'écran, zones, procédures (cas d'usage, étapes, résultat, erreurs et solutions), questions, renvois ; FR et NL côte à côte. Un bouton ou un menu se cite par sa clé de traduction (`{{clé}}`) : `RichText` affiche le libellé réel. `PATHS` (même fichier) donne le parcours de lecture de chaque rôle. `help/HelpButton.tsx` ouvre la fiche de l'écran dans un panneau latéral ; `pages/HelpPage.tsx` est le centre d'aide (parcours, recherche, impression). Les identifiants et adresses des fiches sont ceux de `frontend/src/screens.ts`, que les tickets utilisent aussi : un test les compare. L'explication de chaque champ est dans `frontend/src/hints.ts` (une clé par concept, appelée par `tooltip={hint('clé')}`). Aucune donnée en base, aucune route : l'aide est du code livré avec l'interface ; la FAQ locale en base arrive en 0.2.8. Le texte passe par React, jamais par `innerHTML`.

## FAQ locale, captures et groupes de boutons (0.2.8)

- **FAQ locale** : table `help_faq` (migration 008), routes `/api/faq` (5), outils MCP `list_faq`, `get_faq`, `create_faq`, `update_faq`, `deactivate_faq` (retrait en deux appels). Lecture par toute personne connectée ; écriture par l'administrateur et par les gestionnaires du registre (`canManage`, `services/faq.js`) ; désactivation logique ; `created_by` et `updated_by` ; journal d'audit sans le texte. Commune aux deux entités. Affichée par le panneau de chaque écran (`?topic_id=`) et par le centre d'aide ; « Proposer pour la FAQ » dans le tiroir d'un ticket résolu.
- **Captures de l'aide** : `frontend/help-capture/capture.spec.ts` (Playwright, `npm run help:capture`) lit les captures décrites dans les fiches (`shots`) et écrit `frontend/public/help/<langue>/<id>.jpg`. `npm run help:demo` démarre une instance éphémère sur `backend/instance/atelier.exemple.json` avec un compte de démonstration : jamais de donnée réelle. Un bouton se vise par sa clé de traduction. Les repères `[[n]]` du texte des zones sont ceux de la capture d'ensemble : un test les compare, vérifie que chaque capture existe en FR et en NL, qu'elle est un JPEG de moins de 400 Ko et qu'aucune n'est inutilisée. nginx : `absolute_redirect off` et `try_files $uri /index.html` pour que `/help` reste l'écran du centre d'aide malgré le dossier des captures.
- **Groupes de boutons** : `components/GroupItem.tsx` remplace `Form.Item` pour les champs à boutons ou à cases : le titre est le nom du groupe (`role="group"`, `aria-labelledby`), pas un `<label>` orphelin.

77 routes au total, 70 outils MCP exposés.

## Audit des fiches et script de recette (0.2.9)

- **Audit « fiche contre écran réel »** : `frontend/help-capture/audit-fiches.spec.ts` (`npm run help:audit`, sur l'instance de démonstration). Pour chaque fiche, tout libellé `{{clé}}` cité dans la liste des zones doit se retrouver à l'écran de la fiche ; les absences normales (état conditionnel, titre de fenêtre) sont listées avec leur raison dans `KNOWN_ABSENT`. Les libellés cités par les étapes sont listés « non vus à l'écran » à relire à la main (ils sont souvent dans une fenêtre). Une fiche décrite sans vérification contre l'écran est une erreur en puissance.
- **Script de recette** : `frontend/help-capture/recette.mjs`, à lancer depuis un poste qui atteint l'instance (`RECETTE_URL`, `RECETTE_USER`, `RECETTE_PASSWORD` dans la fenêtre de commande, jamais dans le fichier) avec Node et le paquet `playwright` ; il pilote le Chrome du poste. Il rejoue la version affichée, le panneau et ses captures, nginx, le néerlandais, la FAQ (création, correction, retrait), les clés brutes, le parcours avec `#`, l'image de création d'un compte, puis relève les remarques de Chrome (avec l'élément visé) et les étiquettes mal reliées ou les champs sans identifiant ni nom sur 11 écrans et fenêtres. Il modifie l'instance : une question de FAQ d'essai (retirée ensuite) et la langue du compte (remise en français).
- **Champs** : les zones de recherche et les champs de motif hors `Form.Item` portent un `name` ; les titres de groupes de boutons ou de cases passent par `GroupItem`.
