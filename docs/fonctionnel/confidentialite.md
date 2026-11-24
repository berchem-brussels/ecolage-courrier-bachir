# Confidentialité du courrier (version 0.5.0)

Exigences : CR-001 à CR-005, CR-007, CR-008, CA-005 du cahier des charges.

## Les trois niveaux

| Niveau | Qui le lit | Particularités |
| --- | --- | --- |
| Normal | Secrétariat et gestionnaire de l'entité, service traitant, services en copie, agent nommé | Comportement des versions précédentes |
| Restreint | Secrétariat et gestionnaire de l'entité, et les personnes nommément désignées | Un agent du service traitant qui n'est pas désigné ne le lit pas, même s'il est membre du service |
| Confidentiel (pli remis fermé) | Secrétariat et gestionnaire de l'entité, et le destinataire nommé | Enregistré sans scan et sans objet ; ne s'attribue pas à un service |

L'administrateur, l'auditeur et l'autre entité ne lisent jamais un courrier restreint ou confidentiel. Un rôle vaut pour une entité.

## Parcours

1. À l'enregistrement, le secrétariat choisit le niveau. Pour un courrier restreint, il désigne au moins une personne (agent ou responsable de service actif de l'entité). Pour un pli confidentiel, il désigne le destinataire nommé, et lui seul ; l'objet n'est pas demandé et aucun fichier ne peut être joint.
2. Dans les listes, un cadenas et le niveau marquent le courrier. Un agent qui n'y est pas désigné ne le voit ni dans ses bannettes, ni dans ses compteurs, ni dans la recherche, ni dans ses notifications.
3. Quand le pli est remis fermé à son destinataire, le registre ouvre la fiche et enregistre la remise : qui remet (la personne qui enregistre), qui reçoit (le destinataire nommé), la date et l'heure sont posées par le serveur. La remise se fait une fois.
4. Le registre peut changer le niveau d'un courrier enregistré (normal ou restreint) avec un motif obligatoire. Le motif et le changement se lisent à l'historique, par le registre seulement, et sont inscrits au journal d'audit sans objet ni nom.
5. Un courrier déjà enregistré ne devient pas confidentiel : son objet aurait déjà été écrit. Un pli confidentiel peut redescendre (le destinataire l'a ouvert).

## Assistants (MCP)

Un courrier confidentiel ne livre ni objet, ni note, ni destinataire écrit, ni référence, ni commentaire, ni pièce à un assistant, même au secrétariat. Le journal d'audit ne garde que des numéros.

## À savoir

- La désignation d'un agent est la seule clé de lecture d'un courrier restreint : le rattachement à un service ne suffit pas (écart E76).
- Un pli confidentiel est dans l'onglet « Moi » de son destinataire nommé.
- Personne ne change son propre rôle d'application ni ne désactive son propre compte (E75).
