# Notes de livraison, version 0.5.0 du 24/11/2026

## Périmètre

Étape 5 du planning, première moitié : **confidentialité** du courrier entrant (CR-001 à CR-005, CR-007, CR-008, CA-005) et garde-fou **E75**. Migration 011, aucune dépendance changée, aucun changement de Dockerfile : construction sans `--no-cache`. La 0.5.0 reprend tout le contenu de la 0.4.1 (installée, recettée par script et à la main, publiée le 24/11/2026). Les adresses, ports et dossiers de ce document sont des valeurs d'exemple ; les vraies valeurs sont dans les fichiers du projet et dans la conversation.

## Ce qui change

| Domaine | Changement |
| --- | --- |
| Niveaux | Normal, restreint, confidentiel, choisis à l'enregistrement par le secrétariat ou le gestionnaire |
| Restreint | Lu du registre de l'entité et des personnes désignées seulement (E76) |
| Pli confidentiel | Sans scan, sans objet (texte fixe), non attribuable ; lu du registre et du destinataire nommé ; remise enregistrée (qui remet, qui reçoit, quand) |
| Changement de niveau | Normal ou restreint, par le registre, avec un motif obligatoire ; journal d'audit sans objet ni nom ; historique lisible du registre seulement ; un courrier enregistré ne devient pas confidentiel (E77) |
| Mêmes droits partout | Fiche, pièces, historique, commentaires, listes, bannettes, compteurs, recherche, cloche, MCP |
| Assistants | Un pli confidentiel ne livre jamais d'objet, de note, de destinataire écrit, de référence, de commentaire ni de pièce (CA-005) ; trois outils MCP de plus |
| E75 | Personne ne change son propre rôle d'application ni ne désactive son propre compte (serveur et écran) |
| Aide | Deux procédures et une question, FR et NL |
| API et MCP | 3 routes (98 au total), 3 outils (92 exposés) |
| Documents et outils | Documents de l'archive 0.4.1 corrigés (E73) ; scripts de recette versés (E74) |

## Migration

La migration 011 s'applique seule au démarrage : `[DB] Migration 011_confidentialite appliquée`. Elle ajoute quatre colonnes à `mails` (tout courrier existant devient « normal ») et deux tables (`mail_designees`, `mail_confidentiality_changes`). Elle est jouée sur une base de la 0.4.1 par un test. **Une sauvegarde précède toujours la mise à jour.**

## Questions RGPD du standard (section 9.3)

| Question | Réponse | Suite |
| --- | --- | --- |
| Nouvelles données personnelles ? | **Oui** : les personnes désignées d'un courrier (qui peut le lire), l'enregistrement de la remise d'un pli (qui remet, qui reçoit, quand) et les motifs de changement de niveau (texte libre, lisible du registre seulement). Le journal d'audit n'en garde ni objet ni nom | Inscrire au registre des traitements (article 30) et à l'AIPD avec le DPO (action 43 de `DECISIONS.md`) ; aucune durée de conservation appliquée avant l'étape 20 |
| Nouvelle finalité ? | **Non** : la version protège davantage une donnée déjà traitée | Aucune |
| Nouveau destinataire ? | **Non** : elle réduit au contraire le nombre de personnes qui lisent un courrier restreint ou confidentiel ; l'administrateur, l'auditeur et l'autre entité n'y accèdent jamais | Aucune |

## Scripts de recette

- `recette.mjs` (38 contrôles) attend la version 0.5.0 par défaut ; son contrôle 11 ouvre un courrier « enregistré » (correction de la recette de la 0.4.1, E74).
- `recette-agent.mjs` (69), `recette-faq.mjs` (5) et `recette-e55.mjs` (prise en charge sans agent nommé) : inchangés dans leur principe.
- `recette-confidentialite.mjs` (37 sur la démonstration) : avec trois comptes de test et des courriers fictifs, joue le restreint (collègue refusé, désigné admis, pastille à l'écran, levée du niveau), le pli confidentiel (objet fixe, destinataire changé avec motif, remise une fois, refus d'attribution) et le cloisonnement ; nettoie en fin de passage (comptes désactivés, courriers annulés, numéros conservés).
- `recette-parcours.mjs` : parcours du traitement avec de vrais comptes (secrétariat et agent), depuis PowerShell.
- Lancement comme d'habitude, sur le PC, avec `RECETTE_URL`, `RECETTE_USER` et `RECETTE_PASSWORD` tapés dans PowerShell (mot de passe masqué).

## Mise à jour

Procédure de `docs/APRES-DEPLOIEMENT.md`, section 2, avec `courrier-v0_5_0.tar.gz` (taille et empreinte SHA-256 donnés dans la conversation) : sauvegarde, extraction après test de l'archive, construction sans `--no-cache`, démarrage ; aucune commande ponctuelle. **Retour arrière** : l'archive 0.4.1 **avec** restauration de la base de la sauvegarde, puisque la migration 011 change le schéma.

## Liste de contrôle de la recette

1. Version `v0.5.0` ; `/api/version` rend `0.5.0` ; une ligne `011_confidentialite` en tête de `schema_migrations`.
2. `recette.mjs`, `recette-faq.mjs`, `recette-agent.mjs`, `recette-e55.mjs` et `recette-confidentialite.mjs` : tous conformes ; vérifier ensuite que les comptes `recette-…@exemple.test` sont désactivés.
3. À la main, avec les comptes d'essai du secrétariat (`juliesecretaire@exemple.test`) et de l'agent d'essai (`agent.essai@exemple.test`) : enregistrer un courrier restreint en désignant l'agent ; un autre agent du service ne le voit pas ; enregistrer un pli confidentiel (aucun objet demandé, aucun fichier possible) ; enregistrer la remise ; changer le niveau d'un courrier avec un motif.
4. Administration › Utilisateurs : le rôle de sa propre ligne est verrouillé et « Désactiver » n'y figure pas (E75).
5. Rattacher les agents et responsables réels à leurs services avant la recette avec l'utilisatrice clé (action 24).

## À confirmer avec l'utilisatrice clé

Lecture stricte du restreint : seules les personnes désignées le lisent (E76) ; le pli confidentiel ne se choisit qu'à l'enregistrement (E77) ; la remise du pli (E78) ; le droit du gestionnaire à voir restreint et confidentiel (E80).

## Limites connues

Voir `ETAT.md`, section 5, et `ECARTS-CDC.md` (E44 à E48, E50 à E54, E56 à E71, E76 à E81). Suppléances, entité active dans l'en-tête et demande d'enregistrement complet d'un pli (CR-006) viennent en 0.5.1 ; le registre imprimable et les exports à l'étape 6. L'application ne remplace pas encore iCourrier.
