---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/projets/[id]/page.tsx"]
---

## Scope

Site public du portfolio (accueil `/` et fiches `/projets/[id]`). Mode : Experience. L'admin, l'API et l'authentification restent intacts.

## Audience, job, action

- Public : recruteurs et tech leads qui cherchent un développeur fullstack junior en CDI à partir de juillet 2027.
- Leur travail : comprendre en quelques secondes qui est Théo, juger ses projets réels, puis le contacter.
- Action principale : START = contact (e-mail, LinkedIn, GitHub). Action secondaire : SELECT = mode rapide (la notice, tout le contenu en HTML lisible).
- Preuves : projets réels avec chiffres vérifiés (commits, PR, durée, rôle), parcours, alternance SII. Aucune affirmation inventée.
- Contraintes : CSP `self` (pas de script ni de police tierce), polices auto-hébergées, `prefers-reduced-motion`, WCAG 2.2 AA, tout le contenu existe aussi en HTML (notice) pour les lecteurs d'écran, le SEO et les visiteurs pressés.

## Direction contract

THESIS: Le portfolio est une console portable qu'on tient en main. On ne lit pas une liste de projets : on insère une cartouche et on joue. La page refuse le hero coupé en deux, la grille de cartes et la frise chronologique du portfolio de dev classique.

OWN-WORLD: Bureau aubergine de nuit (#211a28). Console cobalt biseautée en pixel art (#2e4a99, ombres #1a275a, reflets #6b8edd). Écran LCD à 4 tons rose-sépia (#f9e8d2, #eca07f, #b4465c, #3b1734) avec trame. Boutons A et B framboise, START jaune, SELECT ardoise. Cartouches à étiquette crème avec un bandeau de catégorie : INFRA sarcelle, IA violet, JEUX vert, WEB orange. Polices bitmap maison en 3×5 et 5×7. Notice papier imprimée en deux tons, cobalt et framboise.

STORY: En 5 secondes, le recruteur comprend : Théo, développeur fullstack à Toulouse, cherche un CDI à partir de juillet 2027. Il joue 30 secondes : il marche dans la rue toulousaine et insère GMAILIA. Les chiffres réels le convainquent d'une posture d'opérateur. Il appuie ensuite sur START pour écrire, ou ouvre la notice pour tout lire.

FIRST VIEWPORT: La console paysage est centrée : environ 1100 px de large à 1440, pour environ 75 % de la hauteur. L'écran LCD est au centre, avec la rue, Théo, le facteur et la boîte de dialogue. La croix est à gauche, A et B à droite. Sous l'écran : SELECT « mode rapide » et START « contact », cerclé. En haut, la cartouche GMAILIA est à moitié insérée. Le post-it des commandes est en haut à gauche, l'encart de quête « CDI juillet 2027 » en haut à droite. Le haut de l'étagère « Ludothèque » dépasse en bas. Sur mobile, la console passe en portrait : l'écran en haut, les commandes dessous.

FORM: Console portable « TS-27 », la direction tirée (rang 6 de ma liste jouable), seed:06b9b34f6b19bba9. Interaction signature : l'insertion de cartouche. La cartouche vole de l'étagère vers la fente, l'écran clignote, puis le projet démarre. Grammaire de mouvement : des pas de pixel, `steps()`, aucun easing doux.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Memorable moment

Insérer une cartouche et voir le projet démarrer sur l'écran LCD. Dans la rue, le facteur ouvre le contact et la boulangerie affiche « chocolatine ».

## Unresolved decisions

- Nommer ou non le client Bérénisse Phone dans la cartouche e-commerce (l'employeur du stage est déjà public sur le site actuel).
- Lier ou non les démos en ligne (sous-domaines personnels) : pas de lien tant que Théo n'a pas décidé.
- Adresse e-mail de contact : on reprend celle du site actuel, à confirmer.
