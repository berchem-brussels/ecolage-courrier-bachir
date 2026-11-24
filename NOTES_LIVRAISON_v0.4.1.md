# Notes de livraison, version 0.4.1 du 24/11/2026

## Périmètre

Étape 4 bis : correction de l'écart E55 relevé par l'audit complet du cahier des charges. La 0.4.1 **remplace la 0.4.0, jamais installée** : elle contient tout le traitement de la 0.4.0 (voir `NOTES_LIVRAISON_v0.4.0.md`) et la migration 010, qui s'applique seule au démarrage depuis la 0.3.1. Aucune dépendance changée, aucun changement de Dockerfile : construction sans `--no-cache`. Les adresses, ports et dossiers de ce document sont des valeurs d'exemple ; les vraies valeurs sont dans les fichiers du projet et dans la conversation.

## Ce qui change par rapport à la 0.4.0

| Domaine | Changement |
| --- | --- |
| Prise en charge | Avec un agent nommé, lui seul (inchangé). **Sans agent nommé**, tout agent ou responsable du service traitant prend le courrier en charge et en devient l'agent nommé (nom sur la fiche, bannette « Moi », droit de clôture). Un courrier non attribué, annulé, d'une autre entité ou d'un autre service reste refusé |
| Interface | Le bouton s'affiche pour tout membre du service quand personne n'est nommé ; message du bouton mis à jour |
| Aide et documentation | Fiche « Bannettes » (FR et NL) et `docs/fonctionnel/traitement.md` |
| Documents | Écarts E56 à E71 ouverts, E55 et E72 clos, planning des étapes révisé (`ETAT.md`) |

## Questions RGPD du standard (section 9.3)

Réponses valables pour les étapes 3 (0.3.x), 4 (0.4.x) et cette version.

| Question | Réponse | Suite |
| --- | --- | --- |
| Nouvelles données personnelles ? | **Oui** (étapes 3 et 4) : attributions (qui a attribué, à qui, motif de renvoi), agent nommé, prise en charge, clôture avec note libre, commentaires en texte libre, événements d'historique. La 0.4.1 n'en ajoute pas | Inscrire au registre des traitements (article 30) et à l'AIPD avec le DPO (action 35 de `DECISIONS.md`) ; aucune durée de conservation appliquée avant l'étape 20 |
| Nouvelle finalité ? | **Non** : suivi du traitement du courrier, finalité déjà celle de l'application | Aucune |
| Nouveau destinataire ? | **Non** : les agents et responsables lisent le courrier de leur service (lecture seule), le secrétariat et le gestionnaire l'administrent ; l'administrateur et l'auditeur n'accèdent pas au contenu ; le texte des commentaires n'entre ni au journal d'audit ni dans la cloche | Aucune |

## Migration

Aucune migration nouvelle. Depuis la 0.3.1, la migration 010 s'applique au démarrage (`[DB] Migration 010_traitement appliquée`). **Une sauvegarde précède toujours la mise à jour.**

## Mise à jour

Procédure de `docs/APRES-DEPLOIEMENT.md`, section 2, avec `courrier-v0_4_1.tar.gz` (taille et empreinte SHA-256 donnés dans la conversation) : sauvegarde, extraction après test de l'archive, construction sans `--no-cache`, démarrage. **Retour arrière** : l'archive 0.3.1 **avec** restauration de la base de la sauvegarde, puisque la migration 010 change le schéma.

## Liste de contrôle de la recette

1. Version `v0.4.1` ; `/api/version` rend `0.4.1` ; une ligne de migration `010_traitement` au démarrage.
2. `recette.mjs` (38 contrôles), `recette-faq.mjs` (5) et `recette-agent.mjs` : tous conformes ; vérifier ensuite que les trois comptes `recette-…@exemple.test` sont désactivés. `RECETTE_VERSION` n'est pas à fournir (0.4.1 par défaut).
3. Administration › Types de courrier : le cadre « Motifs de clôture » montre quatre motifs par entité.
4. **À la main** : attribuer un courrier fictif à un service **sans nommer d'agent**, se connecter avec un agent de ce service, le prendre en charge (son nom apparaît), puis le clore ; refaire avec un agent nommé et vérifier qu'un collègue ne voit pas le bouton. Le script `recette-agent.mjs` ne joue pas ce cas (il est couvert par les tests serveur).
5. À la main, avec l'utilisatrice clé : commenter (les deux portées), clore, rouvrir avec le secrétariat.
6. Rattacher les agents et responsables réels à leurs services avant (action 24).

## Limites connues

Voir `ETAT.md`, section 5, et `ECARTS-CDC.md` (E44 à E48, E50 à E54, E56 à E71). L'application n'est pas encore utilisable pour remplacer iCourrier : confidentialité, délais, accusés de réception, relève des e-mails, courrier sortant, exports, reprise d'iCourrier et PostgreSQL restent à livrer (planning d'`ETAT.md`).
