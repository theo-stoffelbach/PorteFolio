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

- `codex` : Codex CLI connecté à un compte OpenAI ;
- `claude` : Claude Code connecté à un compte Anthropic ;
- `agy` : Antigravity CLI connecté à un compte Google.

Sans `AI_REVIEWER`, tous les exécutables disponibles sont lancés. Une sélection
peut être forcée :

```bash
AI_REVIEWER=codex,claude npm run review:ai
```

L'échec d'un reviewer n'empêche pas les autres de terminer. Il doit être
signalé comme indisponible ; son approbation ne doit jamais être supposée.

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
