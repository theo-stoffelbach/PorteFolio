# Process de revue multi-IA des Pull Requests

Le dépôt peut faire analyser la Pull Request de la branche courante par tous
les reviewers CLI disponibles :

```bash
npm run review:ai
```

Le système complète les GitHub Actions ; il ne les remplace pas.

- GitHub Actions exécute le lint, TypeScript, les audits et le build.
- Les reviewers IA recherchent les bugs, régressions, problèmes de sécurité et
  lacunes de tests dans le diff.
- L'agent principal reproduit les remarques, écarte les faux positifs, corrige
  les problèmes valides puis relance les tests et les reviews.

## Reviewers pris en charge

- `claude` : Claude Code connecté à un compte Anthropic ;
- `kimi` : Kimi CLI connecté à un compte Moonshot ;
- `gemini` : Gemini via Google Antigravity CLI (`agy`) ;
- `codex` : OpenAI Codex CLI connecté à ChatGPT.

Sans `AI_REVIEWER`, tous les exécutables disponibles sont lancés. Une sélection
peut être forcée :

```bash
AI_REVIEWER=claude,kimi,gemini,codex npm run review:ai
```

L'échec d'un reviewer n'empêche pas les autres de terminer. Il doit être
signalé comme indisponible ; son approbation ne doit jamais être supposée.

Le runner ne doit être lancé que sur une branche de confiance dont les
modifications de `package.json` et `scripts/ai-review.mjs` ont été inspectées.
Pour une contribution externe non fiable, ne jamais exécuter le script contenu
dans la PR : utiliser une copie approuvée provenant de la branche protégée.

Les reviewers travaillent dans un répertoire temporaire sans checkout et ne
reçoivent que le prompt textuel :

- Claude reçoit `--tools ""` et ne persiste pas de session ;
- Kimi charge un agent personnalisé dont la liste `tools` est vide ;
- Gemini charge un agent Antigravity local dont `tools: []`, sans MCP, skill,
  plugin ni sous-agent ;
- Codex s'exécute dans une image Docker épinglée et minimale. Le conteneur est
  en lecture seule, sans capabilities, avec `no-new-privileges`, des limites
  CPU/RAM/PID et aucun checkout monté. Seul un profil d'authentification
  temporaire y est monté ; les fonctions shell, fichiers, web, apps, plugins et
  multi-agent sont désactivées.

Seules les variables d'environnement indispensables à l'exécution et à
l'authentification locale sont transmises. Le runner vérifie aussi que l'état
complet du worktree n'a pas changé pendant chaque analyse et refuse une sortie
qui reproduirait une valeur privée connue.

Après une installation ou une mise à jour des CLI, vérifier l'authentification
et l'absence d'outils avant toute publication :

```bash
npm run review:ai:smoke
```

Ce test contrôle les garde-fous locaux, puis vérifie que chaque reviewer peut
répondre avec son profil authentifié. Il ne publie aucun commentaire GitHub.

## Fraîcheur obligatoire

Chaque commentaire publié commence par :

- le reviewer utilisé ;
- la branche analysée ;
- le SHA complet du commit `HEAD` ;
- la date ISO 8601 de la revue ;
- l'indication précisant si le diff a été tronqué ;
- les éventuels fichiers générés omis du prompt.

Le runner compare le `HEAD` local et celui de la PR avant puis après chaque
review. Si le code change pendant l'analyse, l'avis obsolète n'est pas publié.
Une approbation n'est valide que si son SHA correspond au `HEAD` actuel de la
PR.

Les `package-lock.json`, fichiers générés très volumineux, sont omis du prompt
mais toujours contrôlés par `npm ci`, `npm audit` et le build de la CI. Si le
reste du diff dépasse la limite de contexte, `Diff tronqué` vaut `oui` et le
runner interdit automatiquement un verdict `APPROVE`.

## Boucle de finalisation

1. Lire `AGENTS.md`, la documentation du dépôt et la CI.
2. Vérifier Git, la PR, ses commits et ses contrôles.
3. Exécuter lint, types, tests pertinents, audits et build.
4. Lancer `npm run review:ai`.
5. Récupérer les commentaires généraux, inline, humains et IA.
6. Classer chaque retour : valide, faux positif ou suggestion facultative.
7. Appliquer uniquement les corrections valides liées à la PR et leurs tests.
8. Rejouer toutes les validations, commit et push.
9. Relancer `npm run review:ai` sur le nouveau SHA.
10. Répéter tant qu'un problème bloquant/important valide, un
    `REQUEST_CHANGES`, une CI en échec ou une review obsolète subsiste.

La Pull Request ne doit jamais être mergée sans autorisation explicite.
