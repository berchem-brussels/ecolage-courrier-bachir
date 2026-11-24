# Traitement du courrier (version 0.4.0)

Exigences : CE-010, CE-070, CE-071, CE-073, CE-079, CR-008 du cahier des charges.

## Qui fait quoi

| Rôle (dans l'entité) | Prend en charge | Clôt | Rouvre | Commente |
| --- | --- | --- | --- | --- |
| Agent nommé du courrier | Oui | Oui | Non | Oui |
| Responsable du service traitant | Non, sauf s'il est nommé | Oui | Non | Oui |
| Autre membre du service traitant | Non | Non | Non | Oui |
| Service en copie | Non | Non | Non | Non (il lit les commentaires « entité ») |
| Secrétariat, gestionnaire du registre | Non | Non | Oui, avec un motif | Oui |
| Auditeur, administrateur | Non | Non | Non | Non |

Un rôle vaut pour une entité : rien de tout cela ne vaut pour l'autre entité.

## Parcours

1. Le secrétariat attribue le courrier à un service et nomme un agent (étape 3).
2. L'agent nommé (ou, si personne n'est nommé, un membre du service traitant) ouvre la fiche et clique sur **Prendre en charge** : son nom apparaît sur la fiche et dans les listes, le courrier passe « en traitement ».
3. Pendant le traitement, le service et le registre ajoutent des **commentaires**, à la portée choisie à chaque fois : « le service traitant » ou « toute l'entité ». Un commentaire ne se modifie pas : on le complète.
4. L'agent nommé ou le responsable du service **clôt** le courrier avec un motif de la liste de l'entité et, s'ils le veulent, une note. Le courrier quitte « Mon service » et « Moi », entre dans l'onglet **Clos**, et le secrétariat reçoit une notification.
5. Si le courrier a été clos trop tôt, le secrétariat ou le gestionnaire le **rouvre** avec un motif : il revient « en traitement » chez la même personne, qui est notifiée.

## À savoir

- Sans agent nommé, tout agent ou responsable du service traitant peut prendre le courrier en charge ; il devient alors l'agent nommé. Avec un agent nommé, lui seul le prend en charge.
- Un changement d'agent ou de service, ou un renvoi au secrétariat, remet le courrier à « attribué » : la prise en charge est à refaire. Un courrier clos refuse toute attribution tant qu'il n'est pas rouvert.
- Les motifs de clôture se gèrent dans Administration › Types de courrier (cadre « Motifs de clôture »), par le gestionnaire du registre ou l'administrateur. Un motif désactivé reste lisible sur les courriers déjà clos.
- L'historique de la fiche réunit l'enregistrement, les attributions, la prise en charge, les commentaires que la personne peut lire, les clôtures et les réouvertures ; le registre y voit en plus les consultations de la fiche.
- Ni l'objet ni l'expéditeur du courrier, ni le texte d'un commentaire, ne figurent dans le journal d'audit ni dans les notifications.
- Pas encore livrés : tâches liées (CE-072), statut « Répondu » (courrier sortant), délais, rappels et escalades.
