# Fichiers du courrier et journal des consultations

Fiche fonctionnelle de la version 0.2.0, étape 2 du planning.

## Objet

Joindre à chaque courrier le scan ou la photo reçus, l'afficher à côté de la fiche et garder la trace de chaque personne qui ouvre une fiche ou lit un fichier.

## Pour qui

Le secrétariat et le gestionnaire du registre de chaque entité déposent, enregistrent et lisent les fichiers. L'auditeur de l'entité lit le journal des consultations. L'administrateur règle la taille maximale d'un fichier.

## Règles

| Règle | Source |
| --- | --- |
| Formats acceptés : PDF, JPEG et PNG, reconnus par leur contenu ; le nom et le type annoncé ne comptent pas | CDC CE-020, CE-030 ; décision D-24 du 20/10/2026 |
| Un fichier TIFF est refusé avec un message qui renvoie au réglage PDF des copieurs | Décision D-24 du 20/10/2026 |
| Taille maximale : 50 Mo par fichier, réglable de 1 à 50 Mo | Décision D-23 du 20/10/2026 |
| Un fichier refusé reste affiché avec sa raison jusqu'à ce que la personne ferme la liste des refus | CDC CE-030 |
| Chaque fichier déposé dans la file devient un courrier à l'enregistrement ; le numéro est attribué à ce moment | CDC CE-025, CE-041 |
| Un fichier déposé par erreur se rejette avec un motif ; il ne reçoit pas de numéro et reste sur le serveur jusqu'à la purge de l'étape 12 | Décision Q4 du 20/10/2026 ; CDC CG-012 |
| Un fichier se joint aussi à un courrier déjà enregistré ; il ne se retire pas dans cette version | Décision Q5 du 20/10/2026 |
| Chaque ouverture de fiche et chaque lecture de fichier s'inscrivent au journal des consultations, y compris par un assistant IA | CDC CG-003, CA-007 |
| Le journal ne montre ni l'objet, ni l'expéditeur, ni le nom des fichiers | CDC section 4, rôle d'auditeur |
| Un rôle dans une entité ne donne aucun accès aux fichiers de l'autre | CDC CE-001, CR-007 |

## Écrans

| Écran | Contenu | Actions |
| --- | --- | --- |
| À enregistrer | Cadre de dépôt, liste des refus, aperçu du fichier courant, formulaire d'enregistrement, liste complète de la file repliée | Déposer, passer au fichier précédent ou suivant, « Enregistrer et passer au suivant », « Rejeter ce fichier » avec motif, ouvrir ou télécharger |
| Registre des entrées | Trombone et nombre de fichiers à côté du numéro | Ouvrir la fiche |
| Fiche du courrier | Fichiers dans un lecteur à côté des informations (sur grand écran), au-dessus sur smartphone | Choisir un fichier, ouvrir dans un onglet, télécharger, ajouter un fichier |
| Journal des consultations | Date et heure, personne, action, numéro, numéro du fichier, canal | Filtrer par numéro de courrier et par période |
| Administration › Paramètres | Taille maximale d'un fichier, taille maximale d'une lecture par un assistant IA, valeurs livrées | Enregistrer |

Messages : « Fichier TIFF refusé : réglez le copieur pour produire des PDF. », « Type de fichier refusé. Seuls les PDF, JPEG et PNG sont acceptés. », « Fichier trop volumineux. Taille maximale : 50 Mo », « Ce fichier n'est plus dans la file : il a été enregistré ou rejeté entre-temps. », « Ce fichier est joint à un courrier : il ne se rejette pas. »

## Paramètres et défauts

`pieces.max_mb` (50) et `pieces.mcp_read_max_mb` (5), dans Administration › Paramètres. Chaque changement s'inscrit au journal d'audit avec l'ancienne et la nouvelle valeur.

## Données et conservation

Nouvelles données : le fichier lui-même, son nom d'origine, sa taille, son empreinte, la personne qui l'a déposé ; le journal des consultations (personne, date, heure, courrier, fichier, canal). Stockage dans le volume de données du serveur, hors de toute adresse publique. Aucune durée de conservation n'est encore appliquée : elle arrive avec l'étape 20 (CG-010). Les fichiers rejetés restent jusqu'à la purge de l'étape 12 (CG-012).

## Échanges

API : `/api/pieces`, `/api/consultations`, `/api/settings`. MCP : `list_pieces`, `get_piece`, `read_piece_content`, `create_piece`, `update_piece`, `prepare_reject_piece` et `confirm_reject_piece`, `list_consultations`, `get_settings`, `update_settings`. Aucun webhook, import ni export dans cette version.

## Limites

- La file ne se remplit que par dépôt à l'écran. Boîtes partagées, copieurs et transfert depuis Outlook arrivent à l'étape 12.
- Pas de détection des doublons (étape 12), pas d'antivirus (décision D-08), pas d'aperçu des fichiers Office (décision D-11), pas de découpe d'un lot de scans (décision D-05).
- Un fichier joint ne se retire pas (étape 6).
- Un assistant IA dépose au plus environ 190 ko par fichier.
- Aucun fichier réel avant le passage à PostgreSQL (étape 8) : la base reste une maquette d'atelier.
