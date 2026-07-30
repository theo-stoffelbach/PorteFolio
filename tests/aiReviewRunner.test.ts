import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const ROOT = process.cwd();
const runner = readFileSync(join(ROOT, 'scripts/ai-review.mjs'), 'utf8');
const kimiAgent = readFileSync(
  join(ROOT, 'scripts/reviewers/kimi-agent.md'),
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
  assert.match(kimiAgent, /^tools: \[\]$/m);
  assert.match(kimiAgent, /^subagents: \[\]$/m);
  assert.match(geminiAgent, /^tools: \[\]$/m);
  assert.match(geminiAgent, /^subagent: false$/m);
  assert.match(geminiAgent, /^mcpServers: \[\]$/m);
});

test('Kimi utilise son moteur v2 sans option obsolète', () => {
  assert.match(runner, /kimi: \['kimi', 'kimi-cli'\]/);
  assert.match(runner, /KIMI_CODE_EXPERIMENTAL_FLAG: '1'/);
  assert.doesNotMatch(runner, /'--quiet'/);
  assert.match(runner, /kimi-agent\.md/);
  assert.match(runner, /replace\(\/\^•\\s\*\/, ''\)/);
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

test('chaque review publie le modèle explicitement sélectionné', () => {
  for (const [reviewer, model] of [
    ['claude', 'claude-sonnet-4-6'],
    ['kimi', 'kimi-code/k3'],
    ['gemini', 'gemini-3.6-flash-high'],
    ['codex', 'gpt-5.6-sol'],
  ]) {
    assert.match(
      runner,
      new RegExp(`${reviewer}: '${model.replaceAll('.', '\\.')}'`)
    );
  }

  assert.match(runner, /'-{2}model'|'-{1}model'/);
  assert.match(runner, /- Model : \$\{reviewerModel\}/);
  assert.match(runner, /- Model : \\\`\$\{reviewerModel\}\\\`/);
});

test('le runner fragmente le diff sans transformer cela en troncature', () => {
  assert.match(runner, /const MAX_SOURCE_DIFF_BYTES = 400_000/);
  assert.match(
    runner,
    /process\.platform === 'win32' \? 24_000 : 70_000/
  );
  assert.match(runner, /function splitDiff\(diff\)/);
  assert.match(runner, /Fragment analysé : \$\{index \+ 1\}\/\$\{chunks\.length\}/);
  assert.match(runner, /if \(sectionParts\.length > 1\) sectionSplit = true/);
  assert.match(runner, /!truncated && !sectionSplit/);
  assert.match(runner, /chunkReviews\.length !== chunks\.length/);
  assert.match(
    runner,
    /_Review partielle : le diff source a été tronqué\._\\n\\nVERDICT: \$\{verdict\}/
  );
});

test('les verdicts sont validés séparément pour chaque fragment', () => {
  const functionStart = runner.indexOf('function aggregateChunkReviews');
  const functionEnd = runner.indexOf('\nfunction normalizeVerdict', functionStart);
  assert.notEqual(functionStart, -1);
  assert.notEqual(functionEnd, -1);

  const aggregateChunkReviews = runInNewContext(
    `${runner.slice(functionStart, functionEnd)}
aggregateChunkReviews;`
  ) as (reviews: string[], allowApproval: boolean) => string;

  assert.match(
    aggregateChunkReviews(
      [
        'Premier fragment\nVERDICT: APPROVE\nVERDICT: APPROVE',
        'Second fragment sans verdict',
      ],
      true
    ),
    /VERDICT: COMMENT$/
  );
  assert.match(
    aggregateChunkReviews(
      ['Premier\nVERDICT: APPROVE', 'Second\nVERDICT: APPROVE'],
      true
    ),
    /VERDICT: APPROVE$/
  );
  assert.match(
    aggregateChunkReviews(
      ['Premier\nVERDICT: APPROVE', 'Second\nVERDICT: REQUEST_CHANGES'],
      true
    ),
    /VERDICT: REQUEST_CHANGES$/
  );
});
