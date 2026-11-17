# Notes de livraison, version 0.3.0 du 17/11/2026

## Périmètre

Étape 3 du planning : attribution du courrier (CDC CE-060 à CE-062, CE-120, CE-140, CR-002, CR-007, CR-008).

**Livré** : attribution à un service traitant, à des services en copie et à un agent nommé ; renvoi au secrétariat avec motif ; historique ; bannettes en onglets avec compteurs ; cloche de notifications ; rattachement des personnes à leurs services ; lecture du courrier par les agents et responsables de service (lecture seule) ; fiche d'aide « Bannettes ».

**Non livré** (écarts E44 à E48) : onglets « En retard » et « Mes tâches » ; rappels, escalades, tâches et mentions dans la cloche ; hiérarchie des services ; déplacement d'un courrier vers un autre service par le responsable ; confidentialité à trois niveaux (étape 5) ; traitement et clôture (étape 4).

Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6). Les valeurs du serveur d'acceptance figurent dans le message de livraison et dans les fichiers du projet.

## Ce qui change pour les utilisateurs

| Rôle | Avant | Maintenant |
| --- | --- | --- |
| Secrétariat, gestionnaire | Registre, file « À enregistrer » | Écran d'arrivée « Bannettes » : onglets « À enregistrer » et « À attribuer » ; cadre « Attribution » dans chaque fiche |
| Agent, responsable de service | Aucun accès au courrier | Onglets « Mon service », « Moi », « En copie » ; lecture du courrier et de ses fichiers ; renvoi au secrétariat ; le responsable nomme l'agent |
| Tous les rôles de traitement | Pas de notification | Cloche dans l'en-tête |
| Administrateur | Rôles par entité | Choix des services d'un agent ou d'un responsable dans « Modifier les rôles » |

## Migration et mise à jour

- Migration `009_attribution` appliquée au démarrage de l'API : colonnes ajoutées à `mails` (valeurs vides pour les courriers existants), quatre tables nouvelles. Aucune donnée n'est modifiée ni perdue (test sur une base de la 0.2.9).
- Aucune dépendance changée : construction sans `--no-cache`. Aucune commande ponctuelle : ni script d'atelier, ni changement de propriétaire du volume.
- Procédure : `docs/APRES-DEPLOIEMENT.md`, section 1.2, avec `courrier-v0_3_0.tar.gz`. Retour arrière : archive précédente et restauration de la base depuis la sauvegarde faite avant la mise à jour.

## Avant la recette

1. Créer ou compléter les comptes de test : un compte avec le rôle d'agent dans une entité, rattaché à un service de cette entité (Administration › Utilisateurs › Modifier les rôles, liste « Services »).
2. Sans rattachement, les bannettes d'un agent restent vides : l'écran l'indique.

## Liste de contrôle de la recette

1. Version `v0.3.0` au bas du menu ; `/api/version` rend `0.3.0`.
2. Les courriers existants sont lisibles et listés dans « À attribuer ».
3. Compte de secrétariat : le menu commence par « Bannettes » ; onglets « À enregistrer (n) » et « À attribuer (n) » ; un clic sur « À enregistrer » ouvre la file.
4. Ouvrir un courrier : cadre « Attribution » ; attribuer à un service, avec un agent et un service en copie ; le courrier quitte « À attribuer » ; l'historique montre l'attribution.
5. Changer le service du même courrier sans motif : refusé ; avec motif : accepté.
6. Compte d'agent : « Mon service » (et « Moi » pour l'agent nommé) montre le courrier ; la fiche est en lecture seule (ni correction, ni annulation, ni ajout de fichier) ; le fichier s'ouvre.
7. Compte d'un autre service : ne voit pas le courrier. Compte de l'autre entité : ne le voit pas non plus.
8. Compte d'agent : renvoyer au secrétariat sans motif impossible ; avec motif, le courrier disparaît de sa bannette et réapparaît dans « À attribuer » avec le motif.
9. Cloche : une notification apparaît au bon destinataire (agent nommé, membres du service, service en copie, secrétariat après un renvoi) ; un clic ouvre la fiche ; « Tout marquer comme lu » vide le compteur.
10. Responsable de service : nomme ou change l'agent ; un agent simple ne voit pas ce formulaire.
11. Journal des consultations (auditeur) : les ouvertures par l'agent y figurent.
12. Néerlandais : mêmes écrans, textes traduits (textes rédigés par Claude, à faire relire).
13. Script de recette : `recette.mjs` puis `recette-faq.mjs`, mot de passe saisi dans PowerShell, jamais dans un fichier ni dans la conversation.
14. Avant toute capture : masquer les mots de passe.

## Limites connues

Voir `ETAT.md`, section 5, et `ECARTS-CDC.md` (E44 à E48). Aucune donnée réelle tant que la base n'est pas PostgreSQL (étape 8).
