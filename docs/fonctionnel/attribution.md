# Attribution du courrier et bannettes (version 0.3.0)

Exigences : CE-060 à CE-062, CE-120, CE-140, CR-002, CR-007, CR-008 du cahier des charges.

## Qui fait quoi

| Rôle (dans l'entité) | Voit | Peut |
| --- | --- | --- |
| Secrétariat, gestionnaire du registre | Tout le registre de l'entité | Attribuer, changer le service ou l'agent, mettre en copie, corriger, annuler |
| Responsable de service | Le courrier de ses services (traitant ou copie) et celui qui le nomme | Nommer ou changer l'agent dans son service, renvoyer au secrétariat |
| Agent | Idem | Renvoyer au secrétariat un courrier dont son service est traitant |
| Auditeur, administrateur | Aucun courrier sans rôle de registre ou de service | Le journal des consultations (auditeur) ; la gestion des comptes (administrateur) |

Un rôle vaut pour une entité : un agent de l'administration communale ne voit jamais le courrier du CPAS, même si son service est commun aux deux entités.

## Parcours

1. Le secrétariat enregistre le courrier (écran « Enregistrer un courrier » ou file « À enregistrer »).
2. Dans **Bannettes › À attribuer**, il ouvre la fiche et choisit le service traitant, éventuellement un agent du service et des services en copie. Un courrier déjà attribué ne change de service qu'avec un motif.
3. Les membres du service (ou l'agent nommé) reçoivent une notification et retrouvent le courrier dans **Mon service**, **Moi** ou **En copie**.
4. Un service qui reçoit un courrier qui n'est pas le sien le renvoie au secrétariat avec un motif : le courrier revient dans **À attribuer** avec ce motif, et l'historique garde chaque étape.

## À savoir

- Un service ne peut pas être à la fois traitant et en copie : réattribuer un courrier au service qui l'avait en copie le retire des copies (version 0.3.1 ; la 0.3.0 refusait).

- Un agent ou un responsable doit être rattaché à ses services dans Administration › Utilisateurs › Modifier les rôles ; sans service, ses bannettes restent vides et l'écran le dit.
- « Mon service » montre tout le courrier du service, y compris celui d'un collègue ; « Moi » montre seulement celui dont on est l'agent nommé.
- Les hiérarchies de services ne sont pas appliquées : un agent d'un service parent ne voit pas les courriers des sous-services.
- Pas encore livrés : onglets « En retard » et « Mes tâches » (étapes suivantes), rappels, escalades et mentions dans la cloche.
