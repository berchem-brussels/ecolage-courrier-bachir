# Enregistrement du courrier entrant

## Objet

Donner à chaque courrier reçu un numéro du registre de son entité, sans trou ni doublon, et retrouver ce courrier par la suite.

## Pour qui

Le secrétariat et le gestionnaire du registre de chaque entité (AC, CPAS).

## Règles

| Règle | Source |
| --- | --- |
| Le numéro est attribué par l'application à l'enregistrement, au format `<préfixe>-<année>-<numéro sur six chiffres>` | CDC CE-041, A4 |
| L'année du numéro est celle de la date de réception | Décision D-20 du 13/10/2026 |
| La date de réception ne peut pas être dans le futur | CDC CE-044 |
| Un enregistrement erroné s'annule avec un motif ; le numéro reste au registre et n'est jamais réutilisé | CDC CE-043, standard 7.1 |
| Chaque entité a son registre ; un rôle dans une entité ne donne rien dans l'autre | CDC CE-001, CR-007 |

## Écrans

| Écran | Contenu | Actions |
| --- | --- | --- |
| Enregistrer un courrier | Date de réception, mode d'arrivée, expéditeur, objet, type, langue, urgence ; « + Plus d'options » : destinataire nommé, référence, date du document, nombre de pièces, remarque | Enregistrer ; créer un contact ; le numéro s'affiche et le formulaire se vide en gardant la date et le mode d'arrivée |
| Registre des entrées | Numéro, date, expéditeur, objet, type, statut ; en mode Complet : mode d'arrivée, auteur, horodatage | Rechercher, filtrer par statut et par année, ouvrir la fiche |
| Fiche du courrier | Informations et historique de base | Corriger les champs permis, annuler avec motif |

## Paramètres et défauts

Préfixes AC, CPAS, D-AC, D-CPAS ; six chiffres ; fuseau Europe/Brussels. Types de courrier par entité, réglés par le gestionnaire ou l'administrateur.

## Données et conservation

Expéditeur (personne ou organisation), objet, références. Conservation par type à l'étape 20 ; aucune pièce dans cette version.

## Échanges

Routes `/api/mails`, `/api/contacts`, `/api/mail-types` ; outils MCP `create_mail`, `list_mails`, `get_mail`, `update_mail`, `prepare_cancel_mail`, `confirm_cancel_mail`.

## Limites

Pas encore de pièce scannée, d'attribution, de confidentialité ni d'export (étapes 2 à 6).
