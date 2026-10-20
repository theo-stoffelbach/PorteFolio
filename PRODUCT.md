# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruteurs et responsables techniques qui évaluent un développeur fullstack junior pour un CDI à partir de l'été 2027. Ils arrivent depuis un CV, LinkedIn ou GitHub, souvent sur desktop entre deux candidatures, parfois sur mobile. Leur job : comprendre en quelques secondes ce que Théo sait construire, vérifier que c'est réel, puis le contacter.

## Product Purpose

Portfolio personnel de Théo Stoffelbach, développeur web fullstack basé à Toulouse. Le site doit prouver un savoir-faire par des réalisations concrètes et donner envie de le contacter pour un poste. Succès : un recruteur repart avec une image précise et mémorable du profil, et un moyen évident de le joindre (email, LinkedIn, GitHub).

## Positioning

Théo ne se contente pas d'écrire des applications : il les déploie et les exploite lui-même (auto-hébergement sur son NAS, images Docker, CI qui pousse sur GHCR, mises à jour Watchtower, durcissement sécurité), construit des outils autour des agents IA (mod Claude Code, revue de code multi-IA, contribution à un scanner de sécurité d'agents), et fait aussi des jeux multijoueurs. Le fil conducteur est de livrer des choses qui tournent pour de vrai, de bout en bout.

## Operating Context

- Situation confirmée : alternant chez SII depuis 2024 (backend Perl, Java, PostgreSQL, Linux) ; Master Ynov Campus Toulouse, en M2 jusqu'en juin 2027.
- Parcours : Epitech Digital Toulouse 2021-2022 (major de promotion, école fermée depuis) ; Ynov Informatique Toulouse depuis septembre 2022 ; stage chez Bérénisse Phone (boutique de réparation de téléphones) d'avril à juin 2024, site web complet Node/Express/React.
- Le site est lui-même auto-hébergé : Next.js standalone dans Docker, image poussée sur GHCR par GitHub Actions, déployée sur le NAS.

## Capabilities and Constraints

- Stack existante conservée : Next.js 16 (App Router), React 19, TypeScript, Tailwind 3, framer-motion.
- L'espace admin (login JWT, édition des projets/expériences/formations en JSON via l'API) est conservé ; seul le site public est reconstruit. Les tests de sécurité (`tests/security.test.ts`) et la CSP (`lib/securityHeaders.ts`) doivent continuer à passer : pas de script ni de police depuis un domaine tiers.
- Données publiques servies depuis `data/*.json` via `lib/dataManager.ts`.
- Sortie Docker `standalone` ; aucun service externe requis au runtime.

## Brand Commitments

- Nom : Théo Stoffelbach. Langue du site : français.
- Liens confirmés : GitHub `theo-stoffelbach`, LinkedIn `theo-stoffelbach`.

## Evidence on Hand

- Dépôts GitHub publics et privés de Théo (descriptions vérifiées dans le code ; les privés sont décrits sans lien vers le code).
- Images historiques dans `img/` (captures de projets anciens : UNO, crawler Nintendo, Hack4Mars) et un avatar bitmoji ; `public/images/profile.jpg`.
- Aucun témoignage, client, chiffre d'audience ni distinction autre que « major de promotion Epitech Digital » : ne rien inventer de tel.

## Product Principles

1. Prouver plutôt qu'affirmer : chaque compétence affichée s'appuie sur un projet ou un fait vérifiable.
2. Dire vrai : dates, rôles, statut des projets et contributions aux forks sont exacts.
3. Le contact doit être évident à tout moment.
4. Le site lui-même est une démonstration de savoir-faire (performance, accessibilité, sécurité).

## Accessibility & Inclusion

Cible WCAG 2.2 AA : contrastes, navigation clavier complète, `prefers-reduced-motion` respecté pour toute animation.
