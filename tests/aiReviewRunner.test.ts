import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const runner = readFileSync(join(ROOT, 'scripts/ai-review.mjs'), 'utf8');
const kimiAgent = readFileSync(
  join(ROOT, 'scripts/reviewers/kimi-agent.yaml'),
  'utf8'
);
const geminiAgent = readFileSync(
  join(ROOT, 'scripts/reviewers/gemini-agent.md'),
  'utf8'
);
const reviewerImage = readFileSync(
  join(ROOT, 'scripts/reviewers/Dockerfile'),
  'utf8'
);

test('les agents Kimi et Gemini n’exposent aucun outil', () => {
  assert.match(kimiAgent, /^\s{2}tools: \[\]$/m);
  assert.match(geminiAgent, /^tools: \[\]$/m);
  assert.match(geminiAgent, /^subagent: false$/m);
  assert.match(geminiAgent, /^mcpServers: \[\]$/m);
});

test('Codex est isolé et ses outils sont désactivés', () => {
  for (const protection of [
    "'--read-only'",
    "'--cap-drop'",
    "'no-new-privileges:true'",
    "'features.shell_tool=false'",
    "'features.unified_exec=false'",
    "'features.apps=false'",
    "'web_search=\"disabled\"'",
  ]) {
    assert.ok(runner.includes(protection), `${protection} doit rester actif`);
  }
  assert.match(
    reviewerImage,
    /@openai\/codex@\$\{CODEX_CLI_VERSION\}/
  );
  assert.doesNotMatch(reviewerImage, /gemini-cli/);
});
