# État de l'application courrier

Application courrier · version 0.2.4 · état au 27/10/2026

Archive installée sur NIXUS : `courrier-v0_2_3.tar.gz` (1 261 418 octets), installée en acceptance le 27/10/2026 ; sa recette a relevé un défaut du sélecteur de date et elle n'est pas publiée sur GitHub. Version préparée le 27/10/2026 : 0.2.4 (`courrier-v0_2_4.tar.gz`), qui corrige ce défaut ; à installer et à recetter. Dernière version publiée sur GitHub : 0.2.2 (`courrier-v0_2_2.tar.gz`, 1 271 020 octets), installée et recettée le 27/10/2026. Les fichiers du projet (ce fichier, ECARTS-CDC.md, CHANGELOG.md, APRES-DEPLOIEMENT.md, DECISIONS.md, CAHIER-DES-CHARGES-COURRIER.md) font foi s'ils diffèrent des copies de l'archive ; ils sont recopiés dans l'archive à la version suivante.

## 1. Ce qui fonctionne

Étape 1 du planning, recettée sur NIXUS le 13/10/2026 (0.1.0) et le 20/10/2026 (0.1.1) :

- entités AC et CPAS, quatre registres (AC, D-AC, CPAS, D-CPAS, six chiffres) chargés depuis `backend/config/registres.defaut.json`, modifiables dans Administration › Entités et registres ; préfixe figé dès le premier numéro attribué ;
- rôles par entité (agent, responsable de service, secrétariat, gestionnaire du registre, auditeur) ; rôle global d'administrateur sans accès au contenu du courrier ;
- 24 services réels (noms FR et NL validés), communs possibles aux deux entités, service parent prévu ;
- types de courrier par entité (15 types fictifs d'atelier) ;
- contacts communs, recherche pendant la frappe, création depuis le formulaire (6 contacts fictifs d'atelier) ;
- enregistrement du courrier entrant sans pièce, en série ; numéro attribué par le serveur dans une transaction, selon l'année de réception ;
- registre des entrées : recherche, filtres de statut et d'année gardés dans l'adresse, fiche, correction des champs permis, annulation avec motif (numéro conservé, jamais réutilisé) ;
- cloisonnement AC et CPAS vérifié à l'écran et par les tests ;
- interface FR et NL, thèmes clair et sombre, mode Simple ou Complet, affichage de 360 px au grand écran ;
- API REST et outils MCP sur six ressources (courriers, contacts, types, services, entités, registres), annulation MCP en deux appels ;
- sauvegarde quotidienne du dossier de données par une tâche DSM.

Étape 2, livrée en 0.2.0 et recettée sur NIXUS le 20/10/2026 ; les quatre défauts relevés sont corrigés en 0.2.1, recettée le 27/10/2026 :

- file « À enregistrer » par entité : dépôt de fichiers PDF, JPEG et PNG, type vérifié sur le contenu, TIFF refusé avec sa raison, 50 Mo au plus par fichier (paramètre) ;
- aperçu du fichier à côté du formulaire, passage au fichier suivant, enregistrement qui joint le fichier au numéro, rejet avec motif ;
- fiche du courrier avec ses fichiers dans un lecteur, ouverture et téléchargement par une route authentifiée, ajout d'un fichier à un courrier enregistré ;
- journal des consultations (fiche et fichier, écran et assistant IA), lisible par l'auditeur de l'entité ;
- écran Administration › Paramètres ;
- API et outils MCP des fichiers, du journal et des paramètres ;
- serveur sous `appuser` (10001).

Décomptes des suites au 20/10/2026 (bac à sable, Node 22.22.2), version 0.2.1 : serveur 77 tests, 0 échec ; écrans 58 tests, 0 échec ; typage, accessibilité statique et construction à 0 erreur ; `npm audit --omit=dev` à 0 vulnérabilité dans les deux parties. Contrôle visuel de la 0.2.1 sur l'interface construite derrière le `nginx.conf` livré, avec de vrais événements de dépôt : conforme.

## 1 bis. Version 0.2.2, installée et recettée le 27/10/2026

Aucune fonction nouvelle, aucune migration, aucune dépendance ajoutée. `.github/workflows/ci.yml` conforme à la section 7 de GITHUB.md ; `.gitignore` renforcé et `.gitattributes` ; documents de l'archive avec valeurs d'exemple à la place de l'adresse, des ports et des dossiers de NIXUS ; `backup.sh` sans dossier de l'hôte écrit en dur (même emplacement des sauvegardes sur NIXUS) ; `STANDARD.md`, le cahier des charges, `backend/instance/atelier.json` et une capture des services réels retirés de l'archive ; verrou du serveur : `body-parser` 1.20.9 et `fast-uri` 3.1.9 (avis parus depuis le 20/10/2026). Nouveau test `depot.test.js`. Décomptes : voir `CHANGELOG.md`.

## 1 ter. Version 0.2.3, installée le 27/10/2026, non publiée

Aucune fonction nouvelle, aucune migration, aucun changement dans `src/`. `multer` 2.5.0 (10 alertes hautes de Dependabot sur la 1.x), `vite` 8.3.5, `@vitejs/plugin-react` 6.1.2, `vitest` 4.1.12. Audit complet à 0 dans les deux parties. Décomptes : serveur 82 tests, écrans 58 tests, 0 échec. Verrou de l'interface écrit par npm 11, relu par `npm ci` sous npm 10. Détail dans `CHANGELOG.md`. Défaut relevé à la recette : sélecteur de date en anglais, au format mois/jour (cause : import de la langue d'Ant Design sous `vite` 8). Corrigé dans la 0.2.4.

## 1 quater. Version 0.2.4, préparée le 27/10/2026

Corrige le sélecteur de date de la 0.2.3 (`antd/es/locale/fr_FR` et `nl_NL`). Mêmes dépendances que la 0.2.3, aucun changement du serveur. Nouveau test `imports.test.ts`. Décomptes : serveur 82 tests, écrans 60 tests, 0 échec. Textes de 11 pages et 22 captures comparés à la 0.2.2, en français et en néerlandais : aucune différence. Détail dans `CHANGELOG.md`.

## 2. Environnement d'acceptance sur NIXUS

| Élément | Valeur |
| --- | --- |
| Adresse | `https://192.0.2.10:8450` (certificat auto-signé) |
| Dossier | `/srv/docker/courrier` |
| Conteneurs | `courrier-api` (port interne 3001, non publié), `courrier-web` (8450 HTTPS, 8090 HTTP redirigé) |
| Volumes | `courrier_db-data` (base `sql.js` et, depuis la 0.2.0, fichiers déposés sous `pieces/`), `courrier_ssl-certs` |
| Fichier `.env` | Créé le 13/10/2026, droits 600 ; variables `APP_NAME`, `HTTPS_PORT`, `HTTP_PORT`, `PUBLIC_HOST`, `APP_ENVIRONMENT=acceptance`, `JWT_SECRET`, `CONFIG_ENC_KEY` ; ne jamais le recréer |
| Sauvegarde | Tâche DSM « Sauvegarde courrier », chaque jour à 02:00, `bash /srv/docker/courrier/backup.sh`, archives dans `/srv/backups/courrier`, 30 jours ; 11 sauvegardes présentes le 20/10/2026 à 16:01, fichiers déposés compris |
| Compte du serveur dans le conteneur | `appuser`, uid 10001, depuis la 0.2.0 (relevé sur NIXUS le 20/10/2026) ; `node`, uid 1000, jusqu'à la 0.1.1 |
| Durée de construction mesurée | 8 min 40 s le 13/10/2026 ; 12 min 21 s le 20/10/2026 (0.1.1) ; 11 min 19 s le 20/10/2026 (0.2.0, `--no-cache`) ; démarrage `Healthy` en 90,9 s ; 5 min 21 s le 20/10/2026 (0.2.1, `Healthy` en 63,0 s) ; 2 min 5 s le 27/10/2026 (0.2.2, `Healthy` en 47,6 s) ; 3 min 14 s le 27/10/2026 (0.2.3, `--no-cache`, `Healthy` en 92,7 s) |
| Archives présentes dans le dossier | `courrier-v0_1_0.tar.gz`, `courrier-v0_1_1.tar.gz`, `courrier-v0_2_0.tar.gz`, `courrier-v0_2_1.tar.gz`, `courrier-v0_2_2.tar.gz`, `courrier-v0_2_3.tar.gz` |

Comptes sur l'instance d'acceptance (aucun mot de passe consigné) :

| Compte | Rôles | État |
| --- | --- | --- |
| Administrateur 1 (conducteur du projet) | Administrateur ; AC · Secrétariat | Actif |
| Administrateur 2 (Renaud) | Administrateur ; AC · Secrétariat, CPAS · Secrétariat | Actif |
| CPAS Test | CPAS · Secrétariat | Désactivé (mot de passe passé dans une capture) |
| Version Essai | Aucun | Désactivé (test de la 0.1.1) |
| Test Auditeur | AC · Auditeur | Désactivé (recette de la 0.2.0 ; mot de passe passé dans la conversation) |

Données d'acceptance : courriers `AC-2026-000001` (annulé, motif « Test d'annulation en atelier »), `AC-2026-000002`, `CPAS-2026-000001` ; contact créé à l'écran « Atelier Test ». Toutes fictives. Recette de la 0.2.0 : `AC-2026-000003` enregistré depuis la file avec `courrier-fictif.pdf`, `lettre-fictive.png` ajouté à `AC-2026-000002`, fichiers d'essai rejetés dans la file. Toutes fictives. Recette de la 0.2.1 : `AC-2026-000004` (deux fichiers) et `AC-2026-000005` enregistrés depuis la file, fichiers d'essai rejetés.

## 3. Planning des étapes

Chaque étape est une version complète au standard, déployable sur NIXUS en quelques minutes. L'ordre peut changer après chaque atelier.

| Étape | Version | Contenu | État |
| --- | --- | --- | --- |
| 1 | 0.1.0, 0.1.1 | Socle, entités et registres, rôles par entité, services, types, contacts, enregistrement sans pièce, registre, fiche, annulation | Livrée et recettée |
| 2 | 0.2.0, 0.2.1 | Pièces : dépôt PDF et images, contrôle du type réel, file « À enregistrer », aperçu à côté du formulaire, pièces dans la fiche par route authentifiée, journal des consultations, sauvegarde des fichiers ; ajout de `multer` | 0.2.0 livrée et recettée le 20/10/2026 ; 0.2.1 (corrections de la recette) installée le 20/10/2026, recettée le 27/10/2026 : terminée |
| 2 bis | 0.2.2 | Dépôt public : GitHub Actions (`ci.yml`), `.gitignore`, valeurs d'exemple dans les documents, verrou du serveur mis à jour (`body-parser`, `fast-uri`) ; aucune fonction nouvelle | Installée et recettée le 27/10/2026 ; publiée sur GitHub (étiquette `v0.2.2`, CI verte) |
| 2 ter | 0.2.3 | Dépendances : `multer` 2.5.0, `vite` 8.3.5, `@vitejs/plugin-react` 6.1.2, `vitest` 4.1.12 (accord de Renaud du 27/10/2026) ; aucune fonction nouvelle | Installée le 27/10/2026 ; défaut du sélecteur de date relevé à la recette ; non publiée, remplacée par la 0.2.4 |
| 2 quater | 0.2.4 | Correction du sélecteur de date de la 0.2.3 ; mêmes dépendances ; aucune fonction nouvelle | Préparée le 27/10/2026, à installer, puis publication sur GitHub |
| 3 | 0.3.0 | Attribution : service traitant, copies, agent nommé, renvoi au secrétariat, réattribution, bannettes en onglets avec compteurs, cloche | Prochaine étape après la recette de la 0.2.0 |
| 4 | 0.4.0 | Traitement : prise en charge, commentaires, clôture avec motif, réouverture, historique complet | À faire |
| 5 | 0.5.0 | Confidentialité à trois niveaux, pli remis fermé, entité active dans l'en-tête, suppléances, tests de cloisonnement étendus | À faire |
| 6 | 0.6.0 | Recherche globale, exports Excel et CSV, registre et fiche imprimables, raccourcis clavier, visite guidée, correction de la date de réception avec motif | À faire |
| 7 | 0.7.0 | Connexion Microsoft 365 (OpenID Connect côté serveur, signature vérifiée) | À faire ; inscription d'application Entra à demander |
| 8 | 0.8.0 | PostgreSQL 16, sauvegarde `pg_dump`, restauration jouée ; fin du lot L1 | À faire ; code de PILOT utile (pont PostgreSQL) |
| 9 | 0.9.0 | Délais par type, jours fériés, échéances, onglet « En retard », prolongation | À faire |
| 10 | 0.10.0 | Rappels, escalade, notifications par courriel | À faire |
| 11 | 0.11.0 | Accusés de réception dans la langue de l'expéditeur, modèles de message | À faire |
| 12 | 0.12.0 | Relève des boîtes partagées Microsoft 365, transfert depuis Outlook, doublons, purge de la file, dépôt des copieurs | À faire |
| 13 | 0.13.0 | Ouverture du registre du CPAS, services communs, transfert entre entités ; recette avec l'utilisatrice clé du CPAS | À faire ; D-17 et D-22 à trancher avant |
| 14 | 0.14.0 | Circuits et visa paramétrables, règles de proposition du type et du service | À faire |
| 15 | 0.15.0 | Tableaux de bord par rôle, tâches, traitement en lot, favoris, fusion de contacts, écran RGPD | À faire |
| 16 | 0.16.0 | Courrier sortant : brouillon, validation, numéro de départ, réponse liée, modes d'envoi | À faire |
| 17 | 0.17.0 | Modèles par entité et par langue en PDF, impression en série, liste de dépôt postal, envoi par courriel | À faire |
| 18 | 0.18.0 | Services et agents lus dans SAGA, import Excel en attendant | À faire |
| 19 | 0.19.0 | Webhooks, liens avec STEGA, BOS, Population et Finances | À faire |
| 20 | 0.20.0 | Statistiques, rapport trimestriel, conservation et anonymisation, export des données d'une personne | À faire |
| 21 | 0.21.0 | MCP complet : OAuth 2.1, invites métier, jetons des applications tierces | À faire |
| 22 | 0.22.0 | Reprise de l'historique d'iCourrier | À faire ; export de l'ancien outil à obtenir (I-06) |
| 23 | 1.0.0 | Mise en production : chiffrement au repos, documentation NL et EN complète, grille de sécurité entière, hébergeur, accord de Renaud | À faire |
| L5 | Après décision | OCR, cachet sur le PDF, suggestion par IA, eBox, IRISbox, antivirus (D-01 à D-08) | Après décisions de Renaud |

## 4. Prochaine étape

Étape 3 (0.3.0, attribution) : service traitant, copies, agent nommé, renvoi au secrétariat, réattribution, bannettes en onglets avec compteurs, cloche. La 0.3.0 commencera par l'écart E23 (remarques d'information de Chrome sur les formulaires), décision du 27/10/2026.

Informations attendues avant de la commencer : captures des écrans d'iCourrier et journée type du secrétariat de l'AC (I-01, I-02), confirmation du circuit par défaut (D-16).

## 5. Limites de la version 0.2.1

- Base `sql.js` : maquette d'atelier, données fictives uniquement. Aucun courrier ni aucun scan réel avant le passage à PostgreSQL (étape 8) et l'accord de Renaud.
- La file « À enregistrer » ne se remplit que par dépôt à l'écran ; un fichier joint ne se retire pas ; pas d'antivirus ni d'aperçu des fichiers Office.
- Aucune durée de conservation appliquée aux fichiers ni au journal des consultations (étape 20).
- Connexion par comptes locaux seulement.
- Le courrier et ses fichiers ne sont visibles que du secrétariat et du gestionnaire de l'entité ; l'auditeur voit le journal des consultations ; les autres rôles ne voient rien tant que l'attribution n'existe pas.
- La date de réception ne se corrige pas après l'enregistrement.
- Le choix de l'entité se fait par des boutons dans l'écran, pas encore dans l'en-tête.
- Types de courrier fictifs ; libellés NL des types marqués « à valider ».

## 6. Hors application, à garder en vue

- Dépôt GitHub `berchem-brussels/ecolage-courrier-bachir` : public ; la 0.2.3 n'y est pas publiée et la 0.2.4 prendra sa place ; 0.2.2 envoyée et étiquetée `v0.2.2` le 27/10/2026, travail « tests » vert (1 min 47 s), publication immuable avec l'archive jointe. Protection de `main` active (règle `protection-main`). Restent : deux demandes de fusion de Dependabot (#1 `vitest`, #2 `vite`) à ne pas fusionner sans l'accord de Renaud, et 38 signalements dans « Security and quality » examinés mais non traités : 0 secret, 28 Dependabot (10 hautes sur `multer` côté serveur, 15 sur les outils de développement), 10 CodeQL (faux positifs probables, E25).
- Réponse de Renaud du 27/10/2026 : accord pour `multer` 2.x avec un courriel (raisons et impact sur le standard) ; « idem » pour `vite` et `vitest`, lu par le conducteur du projet comme un oui ; alertes CodeQL à revérifier après la mise en production. `multer` 2.x et `vite` 8 sont installés dans la 0.2.3 et corrigés dans la 0.2.4 ; l'accord de Renaud sur `@vitejs/plugin-react` 6, imposé par `vite` 8 et non nommé dans le courriel, est à confirmer. Le courriel signale aussi l'usage de `npm audit fix` pour la 0.2.2 (E26).
- Notification par courriel de NIXUS en panne (alerte DSM du 13/10/2026) : une sauvegarde en échec ne serait signalée à personne. Bloquant avant une production (standard 15.8).
- Tâches de PILOT désactivées dans le Planificateur de NIXUS : laissées telles quelles, décision du 13/10/2026.
- Zoom du navigateur du conducteur du projet réglé au-dessus de 100 % pour l'adresse de NIXUS : sans effet sur l'application, à remettre à 100 % (Ctrl + 0) pour les contrôles d'affichage.
