# Notes de livraison, version 0.4.0 du 17/11/2026

## Périmètre

Étape 4 du planning : **traitement** du courrier entrant (CE-070, CE-071, CE-073, CE-079). Migration 010, aucune dépendance changée, aucun changement de Dockerfile : construction sans `--no-cache`. Les adresses, ports et dossiers de ce document sont des valeurs d'exemple ; les vraies valeurs sont dans les fichiers du projet et dans la conversation.

## Ce qui change

| Domaine | Changement |
| --- | --- |
| Prise en charge | L'agent nommé la fait en un clic ; son nom apparaît sur la fiche et dans les listes (403 pour toute autre personne, 409 hors « attribué ») |
| Clôture | L'agent nommé ou le responsable du service, depuis « en traitement », avec un motif de la liste de l'entité et une note facultative ; le secrétariat et le gestionnaire sont notifiés |
| Réouverture | Secrétariat et gestionnaire du registre, avec un motif obligatoire ; retour « en traitement » chez la même personne, notifiée |
| Motifs de clôture | Quatre par défaut dans chaque entité ; gérés dans Administration › Types de courrier, cadre « Motifs de clôture » |
| Commentaires | Portée « service traitant » ou « entité » choisie à chaque fois ; ni modification ni suppression ; texte jamais au journal d'audit ni dans la cloche |
| Historique | Fiche : enregistrement, attributions, prise en charge, commentaires lisibles, clôtures, réouvertures ; consultations pour le registre seulement |
| Attribution | Changement d'agent ou de service, renvoi : retour à « attribué » ; un courrier clos refuse l'attribution (409 `CLOSED`) |
| Bannettes et cloche | Onglet « Clos » pour agents et responsables ; trois natures de notification de plus |
| API et MCP | 11 routes (95 au total), 11 outils (89 exposés) |
| Aide | Trois procédures nouvelles ; 22 contrôles `help:check`, `help:audit` réussi ; aucune capture nouvelle (20 par langue) |

## Migration

La migration 010 s'applique seule au démarrage : `[DB] Migration 010_traitement appliquée`. Elle ajoute des colonnes à `mails`, trois tables (`close_reasons`, `mail_events`, `mail_comments`), les quatre motifs par défaut des entités existantes, et reconstruit `notifications` (aucune notification n'est perdue). Elle est jouée sur une base de la 0.3.1 par un test. **Une sauvegarde précède toujours la mise à jour.**

## Scripts de recette

- `recette-agent.mjs` joue aussi le traitement : avec trois comptes de test et un courrier fictif, prise en charge refusée aux autres, prise en charge à l'écran, commentaires, clôture, réouverture, historique, notifications. 69 contrôles sur la démonstration. Même nettoyage qu'avant : comptes désactivés et courrier annulé à la fin.
- `recette.mjs` (38 contrôles) attend la version 0.4.0 par défaut ; `recette-faq.mjs` (5) est celui du dépôt.
- Lancement comme d'habitude, sur le PC, avec `RECETTE_URL`, `RECETTE_USER` et `RECETTE_PASSWORD` tapés dans PowerShell (mot de passe masqué).

## Mise à jour

Procédure de `docs/APRES-DEPLOIEMENT.md`, section 1.2, avec `courrier-v0_4_0.tar.gz` (taille et empreinte SHA-256 donnés dans la conversation) : sauvegarde, extraction après test de l'archive, construction sans `--no-cache`, démarrage ; aucune commande ponctuelle. **Retour arrière** : l'archive 0.3.1 **avec** restauration de la base de la sauvegarde, puisque la migration 010 change le schéma.

## Liste de contrôle de la recette

1. Version `v0.4.0` ; `/api/version` rend `0.4.0` ; une ligne de migration `010_traitement` au démarrage.
2. `recette.mjs` : tous les contrôles conformes (38 sur la démonstration).
3. `recette-faq.mjs` : 5 contrôles conformes.
4. `recette-agent.mjs` : tous les contrôles conformes (69 sur la démonstration), puis vérifier dans Administration › Utilisateurs que les trois comptes `recette-…@exemple.test` sont désactivés.
5. Administration › Types de courrier : le cadre « Motifs de clôture » montre quatre motifs pour chaque entité.
6. À la main, avec l'utilisatrice clé : prendre un courrier fictif en charge avec l'agent nommé, le commenter (les deux portées), le clore, puis le rouvrir avec le secrétariat.
7. Rattacher les agents et responsables réels à leurs services avant cette recette (action 24 de `DECISIONS.md`).

## À confirmer avec l'utilisatrice clé

Seul l'agent nommé prend en charge ; un commentaire de service est lu par le service et le registre ; l'onglet « Clos » ; le retour à « attribué » après un changement d'agent ; les motifs de clôture réels (écarts E51, E52, E54, E55).

## Limites connues

Voir `ETAT.md`, section 5, et `ECARTS-CDC.md` (E44 à E48, E50 à E55). Pas de tâches liées, de statut « Répondu », de délais ni de rappels à cette étape.
