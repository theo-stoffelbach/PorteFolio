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

test('les reviewers hôte utilisent des profils jetables minimaux', () => {
  assert.match(runner, /function prepareHostReviewerProfile/);
  assert.match(runner, /HOME: hostProfileRoot/);
  assert.match(runner, /USERPROFILE: hostProfileRoot/);
  assert.match(runner, /XDG_CONFIG_HOME: join\(hostProfileRoot, '\.config'\)/);
  assert.match(runner, /'--safe-mode'/);
  assert.match(runner, /process\.once\('exit', cleanupManagedTempDirectories\)/);
  assert.match(runner, /\['SIGINT', 130\]/);
  assert.match(runner, /\['SIGTERM', 143\]/);
  assert.match(runner, /removeManagedTempDirectory\(tempDirectory\)/);
  assert.doesNotMatch(runner, /settings\.json', '.*settings\.json/);
  for (const reviewer of ['claude', 'kimi', 'gemini', 'codex']) {
    assert.match(runner, new RegExp(`${reviewer}: \\[`));
  }
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
    ['claude', 'claude-sonnet-5'],
    ['kimi', 'kimi-code/k3'],
    ['gemini', 'gemini-3.6-flash-high'],
    ['codex', 'gpt-5.6-sol'],
  ]) {
    assert.match(
      runner,
      new RegExp(
        `\\b${reviewer}: (?:process\\.env\\.AI_${reviewer.toUpperCase()}_MODEL \\|\\| )?'${model.replaceAll('.', '\\.')}'`
      )
    );
  }

  assert.match(runner, /'-{2}model'|'-{1}model'/);
  assert.match(runner, /- Model : \$\{reviewerModel\}/);
  assert.match(runner, /- Model : \\\`\$\{reviewerModel\}\\\`/);
  assert.match(
    runner,
    /— \$\{reviewer\[0\]\.toUpperCase\(\)\}\$\{reviewer\.slice\(1\)\} \(\$\{reviewerModel\}\)/
  );
  assert.match(
    runner,
    /\$\{review\}\\n\\n\$\{reviewerSignature\}\\n/
  );
});

test('le titre de review dérive dynamiquement le nom du modèle', () => {
  const functionStart = runner.indexOf('function formatModelTitle');
  const functionEnd = runner.indexOf('\nfunction fail', functionStart);
  assert.notEqual(functionStart, -1);
  assert.notEqual(functionEnd, -1);

  const formatModelTitle = runInNewContext(
    `${runner.slice(functionStart, functionEnd)}\nformatModelTitle;`
  ) as (model: string) => string;

  assert.equal(formatModelTitle('claude-opus-5'), 'Opus 5.0');
  assert.equal(formatModelTitle('claude-sonnet-4-6'), 'Sonnet 4.6');
  assert.equal(
    formatModelTitle('claude-opus-5-1-20260802'),
    'Opus 5.1'
  );
  assert.equal(formatModelTitle('kimi-code/k3'), 'K3');
  assert.equal(
    formatModelTitle('gemini-3.6-flash-high'),
    '3.6 Flash High'
  );
  assert.equal(formatModelTitle('gpt-5.6-sol'), 'GPT-5.6 Sol');
  assert.equal(formatModelTitle('vendor/custom-model'), 'vendor/custom-model');
  assert.match(
    runner,
    /Review automatique — \$\{reviewer\} \(\$\{reviewerModelTitle\}\)/
  );
});

test('le runner fragmente le diff sans transformer cela en troncature', () => {
  assert.match(runner, /const MAX_SOURCE_DIFF_BYTES = 400_000/);
  assert.match(
    runner,
    /process\.platform === 'win32' \? 24_000 : 70_000/
  );
  assert.match(runner, /function splitDiff\(diff\)/);
  assert.equal(
    runner.match(/const \{ chunks, sectionSplit \} = splitDiff\(diff\);/g)
      ?.length,
    1,
    'le découpage commun ne doit être calculé qu’une fois'
  );
  assert.match(runner, /Fragment analysé : \$\{index \+ 1\}\/\$\{chunks\.length\}/);
  assert.match(runner, /if \(sectionParts\.length > 1\) sectionSplit = true/);
  assert.match(runner, /!truncated && !sectionSplit/);
  assert.match(runner, /chunks\.length === 1/);
  assert.match(runner, /chunkReviews\.length !== chunks\.length/);
  assert.match(
    runner,
    /_Review partielle : le diff source a été tronqué\._\\n\\nVERDICT: \$\{verdict\}/
  );
});

test('le diff complet et sa troncature restent sûrs quel que soit le cwd', () => {
  assert.match(runner, /'\:\/'/);
  assert.match(runner, /diff = utf8Prefix\(diff, MAX_SOURCE_DIFF_BYTES\)/);
  assert.doesNotMatch(
    runner,
    /encodedDiff\.subarray\(0, MAX_SOURCE_DIFF_BYTES\)/
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

test('les reviews multioctets respectent la limite GitHub et gardent le verdict', () => {
  const functionStart = runner.indexOf('function utf8Prefix');
  const functionEnd = runner.indexOf('\nfunction postReview', functionStart);
  assert.notEqual(functionStart, -1);
  assert.notEqual(functionEnd, -1);

  const clipReview = runInNewContext(
    `${runner.slice(functionStart, functionEnd)}
clipReview;`,
    { Buffer }
  ) as (review: string, maxBytes: number) => string;
  const clipped = clipReview(
    `${'é'.repeat(40_000)}\nVERDICT: REQUEST_CHANGES`,
    2_000
  );

  assert.ok(Buffer.byteLength(clipped, 'utf8') <= 2_000);
  assert.match(clipped, /VERDICT: REQUEST_CHANGES$/);
  assert.match(runner, /MAX_GITHUB_COMMENT_BYTES - bodyOverhead/);
});

test('les mentions GitHub produites par un modèle sont neutralisées', () => {
  const functionStart = runner.indexOf('function neutralizeGitHubMentions');
  const functionEnd = runner.indexOf('\nfunction postReview', functionStart);
  assert.notEqual(functionStart, -1);
  assert.notEqual(functionEnd, -1);

  const neutralizeGitHubMentions = runInNewContext(
    `${runner.slice(functionStart, functionEnd)}
neutralizeGitHubMentions;`
  ) as (value: string) => string;
  const result = neutralizeGitHubMentions(
    'Notifier @org/team, garder @/lib/auth et user@example.com.'
  );

  assert.ok(result.includes('@\u200borg/team'));
  assert.ok(result.includes('@/lib/auth'));
  assert.ok(result.includes('user@example.com'));
  assert.match(runner, /review = neutralizeGitHubMentions\(review\)/);
});
