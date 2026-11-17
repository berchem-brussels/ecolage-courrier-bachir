# Aide

Version 0.2.8. Ce document décrit ce que voit et fait chaque personne ; le détail technique est dans `docs/fr/ARCHITECTURE.md`.

## L'aide de l'écran

Le bouton « Aide » se trouve dans l'en-tête de chaque écran. Il ouvre, à droite, la fiche de l'écran en cours sans le quitter : le rôle de l'écran, ses zones, les procédures (quand, étapes, résultat, ce qu'il faut faire si ça ne marche pas) et les questions fréquentes de l'écran. Un nom de bouton ou de menu cité dans l'aide est le nom réel affiché à l'écran, dans la langue de la personne. Le lien « Mode d'emploi complet » mène à la même fiche dans le centre d'aide.

## L'explication d'un champ

Chaque champ à encoder a une icône « ? » : en la survolant ou en la touchant, on lit ce qu'il faut encoder et d'où vient la valeur, par exemple « le numéro imprimé sur l'avis de réception du recommandé ».

## Le centre d'aide

Menu Aide › « Mode d'emploi et FAQ » :
- Le choix **Parcours** propose, par rôle, les fiches utiles dans l'ordre où l'on s'en sert : agent, responsable de service, secrétariat, gestionnaire du registre, auditeur, administrateur. Le parcours du rôle le plus large de la personne est choisi d'office. « Tout le mode d'emploi » montre toutes les fiches.
- La recherche garde les fiches qui contiennent le mot cherché.
- « Imprimer le mode d'emploi » ouvre le mode d'emploi complet, procédures dépliées, prêt à imprimer ou à enregistrer en PDF.
- Le contact en bas de page est celui du support, réglé dans les paramètres de l'application.

## Les repères et les captures

Chaque fiche montre une capture de l'écran avec des repères numérotés : le numéro dans le texte des zones est celui du cadre rouge sur la capture. Les captures sont produites par un script sur des données fictives, en français et en néerlandais ; elles se refont à chaque version qui change un écran (`npm run help:capture`, voir `docs/fr/ARCHITECTURE.md`).

## La FAQ locale

Sous les questions du mode d'emploi, l'application montre les questions ajoutées par l'équipe : dans le panneau de l'écran concerné et dans le centre d'aide (« Questions générales » pour celles qui ne concernent aucun écran).
- L'administrateur et les gestionnaires du registre ajoutent une question avec « Ajouter une question » (centre d'aide), la corrigent avec « Modifier » et la retirent avec « Retirer ». Une question retirée n'est pas supprimée : elle reste visible de ceux qui gèrent la FAQ, avec la mention « Retirée ».
- La question et la réponse s'écrivent en français et en néerlandais, sans nom, adresse ni donnée de courrier : toutes les personnes connectées, des deux entités, les lisent.
- Depuis un ticket résolu, « Proposer pour la FAQ » ouvre la même fenêtre, avec le titre du ticket et sa résolution déjà écrits en français ; il reste à écrire le néerlandais et à relire le texte pour en retirer toute donnée personnelle.
