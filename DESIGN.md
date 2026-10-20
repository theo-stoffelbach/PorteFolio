---
name: Console TS-27
description: Le portfolio de Théo Stoffelbach, une console portable en pixel art posée sur un bureau de nuit, avec sa notice imprimée.
colors:
  desk: "#211a28"
  desk-deep: "#19141f"
  desk-ink: "#100c15"
  desk-grain: "#292030"
  desk-edge: "#3b2e46"
  cobalt-night: "#0c1130"
  cobalt-deep: "#1a275a"
  cobalt-mid: "#233574"
  cobalt: "#2e4a99"
  cobalt-light: "#4064bb"
  cobalt-glint: "#6b8edd"
  cobalt-dim: "#8e9ad0"
  cobalt-mist: "#aab4e0"
  cobalt-haze: "#c9d0f0"
  framboise-night: "#3a0d1e"
  framboise-deep: "#8c2843"
  framboise-ink: "#b03552"
  framboise: "#c7425c"
  framboise-light: "#e86d81"
  framboise-pale: "#ffb2b8"
  start-deep: "#5a3808"
  start-shade: "#c4841a"
  start: "#ffc53a"
  start-pale: "#fff0a6"
  slate-0: "#090a12"
  slate-1: "#191b2a"
  slate-2: "#292c41"
  slate-3: "#444a6c"
  lcd-0: "#f9e8d2"
  lcd-1: "#eca07f"
  lcd-2: "#b4465c"
  lcd-3: "#3b1734"
  cream: "#f3e6d0"
  label: "#f2e4cb"
  label-ink: "#241a2c"
  paper-shade: "#f0d8bd"
  shelf: "#121626"
  shelf-post: "#1a2034"
  led: "#82ffb8"
  cat-infra: "#2c8a83"
  cat-infra-deep: "#1d5b5a"
  cat-infra-light: "#5ebcad"
  cat-ia: "#7552c4"
  cat-ia-deep: "#4a2e86"
  cat-ia-light: "#a78bf0"
  cat-jeux: "#5e9537"
  cat-jeux-deep: "#3a5e22"
  cat-jeux-light: "#92c65a"
  cat-web: "#d68926"
  cat-web-deep: "#8e5414"
  cat-web-light: "#f5bc5b"
typography:
  display:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "clamp(3.5rem, 1.75rem + 8vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "clamp(1.375rem, 1rem + 1.5vw, 2.125rem)"
    fontWeight: 400
    lineHeight: 1.1
  title:
    fontFamily: "Dela Gothic One, sans-serif"
    fontSize: "clamp(1.25rem, 1.05rem + 0.8vw, 1.5rem)"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "M PLUS Rounded 1c, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.55
  body-lead:
    fontFamily: "M PLUS Rounded 1c, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 500
    lineHeight: 1.65
  body-strong:
    fontFamily: "M PLUS Rounded 1c, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.45
  label:
    fontFamily: "Silkscreen, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  pixel: "1px"
  sheet: "3px"
  chip: "6px"
  tab: "8px"
  button: "14px"
spacing:
  gutter: "16px"
  stack-sm: "12px"
  stack-md: "24px"
  row: "22px"
  sheet-block: "clamp(28px, 3vw + 16px, 64px)"
  sheet-inline: "clamp(20px, 4vw + 4px, 64px)"
  booklet-gap: "clamp(24px, 2vw + 12px, 40px)"
  booklet-max: "1040px"
components:
  button-paper:
    backgroundColor: "{colors.lcd-0}"
    textColor: "{colors.cobalt-deep}"
    typography: "{typography.title}"
    rounded: "{rounded.button}"
    padding: "0.7em 1.2em 0.8em"
    height: "48px"
  button-paper-hover:
    backgroundColor: "{colors.start-pale}"
  button-start:
    backgroundColor: "{colors.start}"
    textColor: "{colors.start-deep}"
    rounded: "{rounded.button}"
    padding: "0.7em 1.2em 0.8em"
    height: "48px"
  button-framboise:
    backgroundColor: "{colors.framboise-ink}"
    textColor: "{colors.lcd-0}"
    rounded: "{rounded.button}"
    padding: "0.7em 1.2em 0.8em"
    height: "48px"
  button-framboise-hover:
    backgroundColor: "{colors.framboise-deep}"
  button-cobalt:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.lcd-0}"
    rounded: "{rounded.button}"
    padding: "0.7em 1.2em 0.8em"
    height: "48px"
  button-cobalt-hover:
    backgroundColor: "{colors.cobalt-mid}"
  sheet-paper:
    backgroundColor: "{colors.lcd-0}"
    textColor: "{colors.cobalt-deep}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.sheet-block} {spacing.sheet-inline}"
  sheet-cobalt:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.lcd-0}"
    rounded: "{rounded.sheet}"
    padding: "{spacing.sheet-block} {spacing.sheet-inline}"
  rubric-tab:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.lcd-0}"
    typography: "{typography.headline}"
    rounded: "{rounded.tab}"
    padding: "0.42em 0.7em 0.32em"
  status-chip:
    textColor: "{colors.cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "0.3em 0.6em 0.35em"
  status-chip-active:
    backgroundColor: "{colors.framboise-ink}"
    textColor: "{colors.lcd-0}"
  cartridge-label:
    backgroundColor: "{colors.label}"
    textColor: "{colors.label-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pixel}"
---

# Design System: Console TS-27

## Overview

**Creative North Star: "La console de chevet"**

Le système est un objet de jeu tenu en main, posé la nuit sur un bureau aubergine : une console portable cobalt en pixel art, son écran LCD rose-sépia à quatre tons, une étagère de cartouches et, en dessous, la notice imprimée qui reprend tout le contenu en HTML lisible. Deux régimes coexistent et ne se mélangent pas. Le **régime pixel** (console, LCD, étagère, cartouches, bureau) est dessiné en basse résolution puis agrandi par un seul facteur, `--px` : chaque forme, ombre et marge y est un multiple entier de ce pixel logique. Le **régime imprimé** (notice, fiches `/projets/<id>`, pages d'erreur) est une feuille de papier rose LCD imprimée en deux encres, cobalt et framboise, posée sur le même bureau.

La densité est celle d'un vrai objet : tout est contenu dans des silhouettes (coque, écran, étiquette, feuille), jamais dans des cartes flottantes. La profondeur vient d'ombres pleines décalées et de biseaux, comme le plastique moulé et le papier posé, sans flou. Le mouvement avance par pas de pixel (`steps()`), jamais par easing doux.

Rejets confirmés par le build : pas de hero coupé en deux, pas de grille de cartes, pas de frise chronologique ; le parcours s'exprime en « cartouches » et en « niveaux » sur des rangées de notice séparées par des filets pointillés.

**Key Characteristics:**
- Une seule échelle pixel (`--px`) pilote la console, l'étagère et les lames du bureau.
- Palette fermée : bureau aubergine, plastique cobalt, framboise, jaune START, ardoise SELECT, LCD quatre tons, bandeaux de catégorie.
- Deux encres sur le papier, cobalt et framboise ; le jaune START n'apparaît que sur le bureau et le cobalt.
- Ombres pleines et biseaux internes, aucune ombre floue.
- Mouvement en `steps()`, entièrement coupé sous `prefers-reduced-motion`.
- Tout le contenu existe aussi en HTML dans la notice.

## Colors

Une palette nocturne et fermée : une teinte sombre de fond, un plastique saturé, deux couleurs de bouton franches, et un écran rose chaud qui sert aussi de papier.

### Primary
- **Plastique cobalt** (`cobalt` et sa rampe `cobalt-night` → `cobalt-glint`) : coque de la console, aplat des feuilles de couverture et de dos de la notice, onglets de rubrique, encre principale du papier (`cobalt-deep` pour le texte, `cobalt` pour les titres et filets). `cobalt-night` est le contour des boutons ; `cobalt-glint` est le reflet du biseau et le cadre en réserve des couvertures.
- **Brume cobalt** (`cobalt-haze`) : texte secondaire posé sur l'aplat cobalt (5,4:1). `cobalt-dim` sert aux légendes en police pixel sur l'étagère sombre.

### Secondary
- **Framboise** (`framboise`, `framboise-ink`, rampe `framboise-night` → `framboise-pale`) : boutons A et B, seconde encre de la notice. `framboise-ink` porte les clés de tableaux, les rôles, les puces carrées, les soulignements de liens, la pastille « En cours », la sélection de texte et l'anneau de focus sur papier. `framboise-pale` souligne les liens sur aplat cobalt.

### Tertiary
- **Jaune START** (`start`, `start-shade`, `start-deep`, `start-pale`) : le bouton START (contact), l'anneau de focus sur le bureau et le cobalt, le lien d'évitement, les libellés de quête et les survols sur fond sombre.
- **Ardoise SELECT** (`slate-0` → `slate-3`) : bouton SELECT et commandes neutres dessinées dans la console.
- **Bandeaux de catégorie** : INFRA sarcelle (`cat-infra`), IA violet (`cat-ia`), JEUX vert (`cat-jeux`), WEB orange (`cat-web`), chacun avec une ombre `-deep` et un reflet `-light`. Ils colorent la coque et le bandeau des cartouches, et les pastilles de légende de l'étagère. La source unique est `lib/catalog.ts` (`CAT_HEX`).

### Neutral
- **Bureau aubergine** (`desk`, `desk-deep`, `desk-ink`, `desk-grain`, `desk-edge`) : fond de page et tuile de lames pixel (`--desk-tile`, 480 × 100 pixels logiques). `desk-ink` est la couleur de toutes les ombres portées sur le bureau ; `desk-edge` le chant de l'étagère.
- **Écran LCD** (`lcd-0` clair → `lcd-3` sombre) : les quatre seuls tons autorisés dans l'écran de jeu. `lcd-0` est aussi le papier de la notice ; `paper-shade` en est l'ombre (biseau des boutons papier, ombre des cartouches imprimées).
- **Crème** (`cream`) : texte courant posé directement sur le bureau. **Étiquette** (`label`) avec son encre (`label-ink`) : étiquettes des cartouches.
- **Étagère** (`shelf`, `shelf-post`) : bois nuit de la « Ludothèque » et ses montants tous les 48 pixels logiques.
- **LED** (`led`) : témoin « DISPO » de l'écran, seul vert lumineux du système.

### Named Rules
**The Two Inks Rule.** Sur le papier, seulement deux encres : cobalt pour le texte et la structure, framboise pour l'accent (clés, rôles, liens, statut actif). Aucune troisième couleur imprimée, catégories exceptées sur les dessins de cartouche.

**The Four Tones Rule.** L'écran LCD n'affiche que `lcd-0` à `lcd-3`, trame comprise. Un sprite ou un texte de jeu qui demande un cinquième ton est faux.

**The START Is Yellow Rule.** Le jaune signale le contact et le focus. Il ne se pose jamais sur le papier rose ; là, le focus devient framboise.

## Typography

**Display Font:** Dela Gothic One (avec sans-serif)
**Body Font:** M PLUS Rounded 1c, graisses 400, 500, 800 (avec system-ui, sans-serif)
**Label/Mono Font:** Silkscreen, graisses 400 et 700 (avec monospace)
**Polices bitmap du canvas :** `SF`, capitales 3 × 5, et `BF`, casse mixte 5 × 7 avec jambages et accents français (`components/console/pixel/fonts.ts`)

**Character:** Une gothique lourde de notice de jeu des années 90 pour les titres, un texte arrondi et dense qui reste lisible en petit corps sur le papier rose, et une sérigraphie pixel pour les libellés courts. Les trois sont téléchargées au build par `next/font` et servies par le site (CSP `font-src 'self'`).

### Hierarchy
- **Display** (400, clamp(3.5rem → 6rem), 0.9) : logo de couverture de la notice uniquement, en `lcd-0` avec un repérage framboise décalé de 0,05em.
- **Headline** (400, clamp(1.375rem → 2.125rem), 1.1) : onglets de rubrique ; nom du personnage (clamp(1.75rem → 2.75rem), 1.05).
- **Title** (400, clamp(1.25rem → 1.5rem), 1.2) : titres de cartouche, noms de niveau (1.3125rem), sous-titres à filet (1.375rem), boutons (1.0625rem).
- **Body** (500, 1rem, 1.55) : texte courant ; chapôs à 1.0625rem / 1.6–1.65 ; largeur de ligne bornée à 56–58ch, 44ch pour les introductions de couverture et de service.
- **Body strong** (800) : valeurs de tableau, rôles, dates, technologies, liens de sommaire. Le gras 800 est la seule emphase du texte.
- **Label** (Silkscreen 400, 0.875–1rem, 1.2–1.3) : clés de tableau, méta de rubrique, statuts, dates de niveau, plaque du personnage, compteurs. Sur l'étagère, Silkscreen à `8 * --spx` en capitales.

### Named Rules
**The Bitmap Belongs To The Canvas Rule.** Les polices 3 × 5 et 5 × 7 ne sont dessinées que dans les canvas (console, LCD, cartouches). En DOM, la voix pixel est Silkscreen ; le texte de lecture reste en M PLUS Rounded.

**The Tabular Facts Rule.** Dates, compteurs et chiffres de projet utilisent `font-variant-numeric: tabular-nums`.

## Layout

**Le pixel logique.** `--px` (pixels CSS par pixel logique) dimensionne toute la scène. En CSS, valeur de départ : `max(min((100vw - 32px) / 468, 100svh / 300, 6px), 1px)` ; le JavaScript (`render/scale.ts`) la remplace par la valeur exacte, arrondie au pixel physique quand l'écart reste sous 6 % vers le bas ou 1 % vers le haut. Paysage : la scène fait 480 × 258 pixels logiques, la partie dessinée (468) tient dans la largeur moins 16 px de gouttière, et en hauteur avec le haut de l'étagère jusqu'au nom des premières cartouches (253 + 47 = 300). Plafond 6 px.

**Bascule portrait.** Sous 720 px (`max-width: 719.98px`, même seuil en CSS et en JavaScript) la console passe en portrait, 260 × 479 pixels logiques, écran en haut et commandes dessous ; `--px` y vaut `min((100vw - 32px) / 260, 4px)`. Chaque élément superposé porte ses coordonnées paysage (`--lx`, `--ly`, `--lw`, `--lh`) et portrait (`--qx`…) dans le repère logique.

**L'étagère.** Grille de colonnes de 72 et de rangées de 52 pixels logiques (`--spx`, l'échelle de la console, au moins 1,75 px sur mobile) : 4 de dégagement, 40 de cartouche, 1 de chant, 3 d'ombre, 4 de vide. Les planches sont peintes en dégradé répété, sans élément DOM.

**La notice.** Un livret centré de 1040 px maximum, gouttière de 16 px, sections empilées avec un écart fluide de 24 à 40 px. Les rangées de cartouches, de niveaux et la fiche du personnage suivent un même gabarit à deux colonnes : `minmax(0, 15rem)` pour le nom ou le visuel, `1fr` pour le texte, écart horizontal `clamp(20px, 3vw, 44px)`. Sous 760 px, tout passe sur une colonne et le dessin de couverture disparaît ; sous 480 px, les tableaux clé / valeur s'empilent.

**Rythme.** Les espacements fluides sont des `clamp()` à pente faible (6 × 2vw + base) ; les valeurs fixes reviennent par 12, 16, 20, 22–24 px. Les rangées respirent à 22 px en haut et 24 px en bas, séparées par des filets pointillés de 2 px.

### Named Rules
**The One Pixel Rule.** Dans le régime pixel, toute dimension s'écrit `calc(N * var(--px))` (ou `--spx` sur l'étagère) avec N entier. Une valeur en px fixe dans la scène casse la grille.

**The Logical Coordinates Rule.** Un élément posé sur la console se place en coordonnées logiques des deux gabarits (`render/layout.ts`), jamais en pourcentages ni en flex.

## Elevation & Depth

Le système n'a aucune ombre floue. La profondeur imite deux matières : le plastique moulé (biseaux internes, reflet en haut à gauche, ombre en bas à droite) et les objets posés sur le bureau (ombre portée pleine, décalée vers le bas à droite, couleur `desk-ink`). Ces ombres décalées sont natives du monde pixel : le corps de la console est dessiné avec la même ombre de 5 × 5 pixels logiques (`render/body.ts`). Sur le papier, une seule ombre décalée subsiste, celle des cartouches imprimées en `paper-shade`.

### Shadow Vocabulary
- **Ombre de bureau** (`box-shadow: calc(5 * var(--px)) calc(5 * var(--px)) 0 var(--desk-ink)`, jeton `--drop`) : feuilles de notice et tout objet posé sur le bureau.
- **Biseau de bouton** (`box-shadow: inset 0 3px 0 var(--btn-hi), inset 2px 0 0 var(--btn-hi), inset 0 -3px 0 var(--btn-shade), inset -2px 0 0 var(--btn-shade)`) : boutons en plastique ; à l'appui, le biseau s'inverse (`inset 0 3px 0 var(--btn-shade), inset 2px 0 0 var(--btn-shade)`).
- **Coque de cartouche** (`box-shadow: inset 3px 3px 0 var(--cat-light), inset -6px -6px 0 var(--cat-deep)`) avec contour pixel par `filter: drop-shadow` pleins de 3 px en `ink` et une ombre `6px 6px 0 var(--paper-shade)`.
- **Repérage d'impression** (`text-shadow: 0.05em 0.05em 0 var(--framboise)`) : logo de couverture seulement.
- **Creux d'étagère** (`box-shadow: inset 0 calc(3 * var(--spx)) 0 var(--desk-deep)`).

### Named Rules
**The Hard Shadow Rule.** Toute ombre a un flou de 0. Une ombre floue ou diffuse n'existe pas dans ce monde.

**The Print Strips Depth Rule.** À l'impression, la console disparaît et les feuilles perdent leur ombre.

## Shapes

Le langage de forme est rectiligne et légèrement adouci, à l'échelle du pixel. Les feuilles de papier ont un coin à peine cassé (3 px) ; les pastilles de statut et la plaque du personnage 6 px ; les onglets de rubrique 8 px en haut seulement, posés sur un filet de 4 px ; les boutons en plastique 14 px, la forme la plus ronde du système, avec un contour de 2 px. Les cartouches imprimées ont un coin supérieur droit coupé en escalier de 3 px (`clip-path`) et trois rainures alternées sombre / clair. Les puces de liste sont des carrés de 7 px en framboise, un gros pixel. Les séparateurs sont des filets : pleins de 3–4 px sous les titres, pointillés de 2 px entre les rangées. Les zones cliquables superposées à la console épousent la forme dessinée (cercle pour A, B et la croix, `6 * --px` pour les pilules).

## Components

### Buttons
Du plastique qu'on enfonce, sur le modèle de START, A et SELECT.
- **Shape:** coins arrondis (14px), contour de 2 px dans la teinte la plus sombre de la famille, hauteur minimale 48 px.
- **Variantes :** papier (`lcd-0`, texte `cobalt-deep`, survol `start-pale`), START (`start`, texte `start-deep`, survol `#ffd35f`), framboise (`framboise-ink`, texte `lcd-0`, survol `framboise-deep`), cobalt (`cobalt`, texte `lcd-0`, survol `cobalt-mid`). Libellé en Dela Gothic One 1.0625rem, icône pixel à gauche avec un écart de 0,6em.
- **Hover / Focus:** changement d'aplat, sans transition. Focus : contour de 3 px décalé de 3 px, jaune sur bureau et cobalt, framboise sur papier.
- **Active:** le bouton descend de 2 px et son biseau s'inverse, d'un seul pas.

### Chips
- **Style :** pastille de statut en Silkscreen 0.875rem, contour de 2 px `cobalt`, coins 6px.
- **State :** « En cours » plein `framboise-ink` texte papier ; « Terminé » contour plein ; « Prototype » contour en tirets.

### Cards / Containers
Il n'y a pas de cartes : il y a des feuilles.
- **Corner Style:** 3px.
- **Background:** papier `lcd-0` avec encre `cobalt-deep` ; couverture et dos en aplat `cobalt` avec texte `lcd-0` en réserve et un cadre intérieur de 2 px `cobalt-glint` à 12 px du bord.
- **Shadow Strategy:** ombre de bureau `--drop`.
- **Internal Padding:** `clamp(28px, 3vw + 16px, 64px)` en bloc, `clamp(20px, 4vw + 4px, 64px)` en ligne.
- **Rubrique :** chaque feuille s'ouvre sur un onglet (titre en aplat `cobalt`, coins 8 px en haut) posé sur un filet de 4 px, avec une méta en Silkscreen framboise alignée à droite. Sur aplat cobalt, l'onglet s'inverse (fond papier, texte cobalt) et la méta passe au jaune.

### Inputs / Fields
Le site public n'a pas de champ de saisie. Le contact passe par le lien e-mail géant du dos de la notice (Dela Gothic One, clamp(1.25rem → 2.75rem)), un bouton « copier » et un message de statut sur sa propre ligne. Le caret, s'il apparaît, est `framboise-ink`.

### Navigation
- **Console :** la croix (naviguer), A (ouvrir), B (retour), SELECT (mode rapide : donne le focus à la notice), START (contact). Ce sont des boutons transparents superposés au corps dessiné, tous accessibles au clavier, avec anneau jaune de 2 px. Les flèches restent des boutons focusables ; la zone ronde de la croix reçoit le pointeur.
- **Notice :** sommaire imprimé sur la couverture, liens en M PLUS 800 avec valeur Silkscreen jaune poussée à droite, séparés par des pointillés `cobalt-glint` ; au survol le libellé passe au jaune et se souligne.
- **Liens de texte :** soulignement framboise de 0,12em décalé de 0,22em ; au survol la couleur passe en framboise et le trait s'épaissit à 0,2em. Sur cobalt, soulignement `framboise-pale` et survol jaune.
- **Lien d'évitement :** pastille jaune en Silkscreen, hors écran jusqu'au focus clavier ; il mène à la notice.
- **Fiches de cartouche :** barre du haut sur le bureau, lien retour en crème 800 qui passe au jaune.

### Console TS-27 (composant signature)
Le corps de la console est rendu par le moteur pixel (`render/body.ts`) : en PNG au build pour le premier affichage, puis en canvas. L'écran LCD est un canvas déjà agrandi à la densité réelle de pixels, trame comprise (facteur entier jusqu'à 6), avec `image-rendering: auto` pour n'absorber que l'écart fractionnaire. Tous les autres canvas et images pixel utilisent `image-rendering: pixelated`. Le h1 et le contenu du jeu sont doublés en texte masqué visuellement ; sans JavaScript, un encart `noscript` aux couleurs LCD renvoie vers la notice.

### Cartouche
Coque de la couleur de catégorie, étiquette crème avec bandeau de catégorie en Silkscreen et nom du projet. Sur l'étagère, 67 × 40 pixels logiques dessinés en canvas, avec un rendu de secours DOM (bandeau `cat`, fond `label`, Silkscreen) avant le premier dessin. Survol et focus : la cartouche se soulève de 2 pixels logiques ; appui : elle s'enfonce de 1. **Insertion** (interaction signature) : la cartouche vole de l'étagère vers la fente en 450 ms sur 10 pas (`steps(10, end)`), s'enfonce dans la fente en 140 ms par pas de 2 pixels logiques, puis l'écran clignote et le projet démarre.

### Named Rules
**The Stepped Motion Rule.** Toute animation avance par `steps()` ou par images entières ; aucune courbe d'easing douce, aucune transition CSS d'état. Les petites animations au repos du jeu tournent à 120 ms par image.

**The Reduced Motion Rule.** Sous `prefers-reduced-motion`, le vol et l'enfoncement de cartouche, l'écran de démarrage, le flash d'insertion, le clignotement et le balancement des sprites sont supprimés, et les soulèvements de cartouche aussi ; le contenu reste identique.

## Provenance des rasters

Le site ne livre aucune image matricielle dessinée à la main ni générée par IA. Les seules images matricielles servies sont `/pixel/console-paysage.png` et `/pixel/console-portrait.png`, rendues au build par `app/pixel/[name]/route.ts` (statique, `force-static`) avec le même moteur pixel que le canvas (`components/console/render/body.ts`, encodées par `render/png.ts`) ; elles affichent la console dès le premier rendu, avant le JavaScript ou sans lui. Tout le reste est dessiné à l'exécution : l'écran LCD, la rue, les sprites, les cartouches et les polices bitmap dans des canvas (`components/console/pixel/*`, `render/*`, `game/*`) ; les dessins de la notice (Théo, le facteur, la console de couverture, les icônes) en SVG pixel généré depuis des grilles de caractères (`components/notice/PixelArt.tsx`, `sprites.ts`) ; les lames du bureau en SVG inline (`--desk-tile`) ; les planches de l'étagère en dégradés CSS. `app/icon.svg` est vectoriel. Toute nouvelle image doit suivre la même voie : grille de pixels dans le code, rendue par le moteur, jamais un fichier peint importé.

## Do's and Don'ts

### Do:
- **Do** dimensionner tout élément de la scène pixel en `calc(N * var(--px))` avec N entier, et le placer en coordonnées logiques des deux gabarits (paysage 480 × 258, portrait 260 × 479).
- **Do** poser le contenu lisible sur des feuilles de papier `lcd-0` à deux encres, cobalt et framboise, avec l'ombre de bureau `--drop`.
- **Do** animer par pas (`steps()`) et couper toute animation sous `prefers-reduced-motion`.
- **Do** garder l'anneau de focus de 3 px décalé de 3 px : jaune `start` sur le bureau et le cobalt, `framboise-ink` sur le papier.
- **Do** dessiner les nouveaux visuels en grilles de pixels rendues par `PixelArt` ou par le moteur canvas, aux couleurs de la palette fermée.
- **Do** doubler tout contenu montré dans la console par du HTML dans la notice.
- **Do** utiliser Silkscreen pour les libellés courts et M PLUS Rounded 800 pour l'emphase, jamais une autre police.

### Don't:
- **Don't** utiliser d'ombre floue ni d'easing doux : les ombres ont un flou de 0, les mouvements avancent par pas.
- **Don't** afficher dans l'écran LCD un ton hors de `lcd-0` à `lcd-3`.
- **Don't** poser le jaune START sur le papier rose, ni une troisième encre imprimée.
- **Don't** reconstruire le portfolio de dev classique : pas de hero coupé en deux, pas de grille de cartes, pas de frise chronologique.
- **Don't** charger de police, script ou image depuis un domaine tiers (CSP `self`).
- **Don't** importer une image peinte, photographique ou générée : les seuls rasters servis sont les deux PNG de la console rendus au build.
