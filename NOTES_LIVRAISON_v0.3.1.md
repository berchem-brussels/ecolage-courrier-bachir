# Notes de livraison, version 0.3.1 du 17/11/2026

## Périmètre

Correction d'un défaut de la 0.3.0 trouvé en jouant l'attribution avec de vrais comptes (`recette-agent.mjs`). Aucune migration, aucune dépendance changée, aucun changement d'écran ni d'aide. Les adresses, ports et dossiers de ce document sont des valeurs d'exemple (GITHUB.md, section 6) ; les valeurs du serveur d'acceptance figurent dans le message de livraison et dans les fichiers du projet.

## Le défaut et sa correction

| Défaut (0.3.0) | Cause | Correction (0.3.1) | Contrôle |
| --- | --- | --- | --- |
| Un courrier renvoyé au secrétariat par le service A ne pouvait pas être réattribué au service B quand B l'avait en copie : refus 409 `SERVICE_INVALID` | Un service ne peut être traitant et en copie à la fois, et la liste des copies restait inchangée | Sans liste de copies donnée, le nouveau service traitant quitte les copies ; une liste donnée qui le contient reste refusée | Test ajouté dans `attribution.test.js` ; il échoue sans la correction (preuve jouée) ; `recette-agent.mjs`, étape 6 |

## Nouveau script de recette : `recette-agent.mjs`

À lancer sur le PC, comme `recette.mjs` (variables `RECETTE_URL`, `RECETTE_USER`, `RECETTE_PASSWORD` dans la fenêtre PowerShell, mot de passe masqué). Le compte doit tenir le registre de l'entité AC.

- Il crée trois comptes de test (agent du service A, agent du service B, responsable du service A) avec un mot de passe aléatoire jamais affiché, et un courrier fictif ; il utilise les deux premiers services actifs de l'AC.
- Il joue : rien de lisible avant l'attribution ; attribution avec un service en copie ; refus (403) de l'attribution, de la modification et de l'annulation par un agent ; écran de l'agent (bannettes, fiche en lecture seule) ; nomination par le responsable ; notifications et cloche ; renvoi avec motif depuis l'écran ; retour dans « À attribuer » avec le motif ; réattribution ; cloisonnement de l'autre entité.
- **À la fin, même en cas d'échec** : le courrier fictif est annulé avec un motif (son numéro de l'AC reste au registre, marqué « annulé » et jamais réutilisé) et les trois comptes sont désactivés.
- Résultat : une ligne `OK` ou `ÉCHEC` par contrôle, `rapport-agent.txt` et deux captures de données fictives.

## Mise à jour

Procédure de `docs/APRES-DEPLOIEMENT.md`, section 1.2, avec `courrier-v0_3_1.tar.gz` : aucune migration, aucune commande ponctuelle, construction sans `--no-cache` (une dizaine de minutes). Retour arrière : l'archive 0.3.0, sans restauration de la base.

## Liste de contrôle de la recette

1. Version `v0.3.1` ; `/api/version` rend `0.3.1` ; aucune ligne de migration au démarrage.
2. `recette.mjs` : tous les contrôles conformes (38 sur la démonstration).
3. `recette-agent.mjs` : tous les contrôles conformes (45 sur la démonstration), puis vérifier dans Administration › Utilisateurs que les trois comptes `recette-…@exemple.test` sont désactivés.
4. À la main, avec le secrétariat : renvoyer un courrier fictif attribué à un service qui avait un autre service en copie, puis le réattribuer au service qui l'avait en copie : accepté, sans motif.
5. Rattacher les agents et responsables réels à leurs services avant la recette avec l'utilisatrice clé.

## Limites connues

Inchangées : voir `ETAT.md`, section 5, et `ECARTS-CDC.md` (E44 à E48).
