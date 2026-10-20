import assert from 'node:assert/strict';
import test from 'node:test';
import { parseProjectCreate, parseProjectUpdate } from '../lib/validation';
import type { Project } from '../lib/types';

const BASE_PROJECT: Project = {
  id: 'cartouche-test',
  title: 'Cartouche test',
  description: 'Description factuelle du projet.',
  technologies: ['TypeScript'],
  imageUrl: '',
  color: '#7552c4',
  weeks: [40, 41],
  year: 2026,
  featured: true,
};

const CONSOLE_FIELDS = {
  category: 'ia',
  shortTitle: 'Cartouche test',
  tagline: 'Une accroche concrète.',
  role: 'Solo',
  period: "juin 2026 → aujourd'hui",
  status: 'en-cours',
  highlights: ['Premier point vérifiable.', 'Second point vérifiable.'],
  stats: [
    { label: 'Commits', value: '488' },
    { label: 'Tests', value: '1 233' },
  ],
  repoUrl: 'https://github.com/exemple/depot',
  isPrivate: false,
  order: 1,
} as const;

// Le projet complet tel que l'admin le renvoie en PUT (id compris).
const FULL_PROJECT = { ...BASE_PROJECT, ...CONSOLE_FIELDS };

test('les champs de console valides sont acceptés à la création', () => {
  const parsed = parseProjectCreate(FULL_PROJECT);
  assert.equal(parsed.category, 'ia');
  assert.equal(parsed.status, 'en-cours');
  assert.equal(parsed.shortTitle, 'Cartouche test');
  assert.deepEqual(parsed.highlights, CONSOLE_FIELDS.highlights);
  assert.deepEqual(parsed.stats, CONSOLE_FIELDS.stats);
  assert.equal(parsed.repoUrl, 'https://github.com/exemple/depot');
  assert.equal(parsed.isPrivate, false);
  assert.equal(parsed.order, 1);
});

test('un projet sans champ de console reste valide', () => {
  const parsed = parseProjectCreate(BASE_PROJECT);
  for (const key of Object.keys(CONSOLE_FIELDS)) {
    assert.equal(key in parsed, false, `${key} ne doit pas être ajouté`);
  }
});

test('l’objet complet renvoyé par l’admin est accepté en PUT', () => {
  const update = parseProjectUpdate(
    { ...FULL_PROJECT, tagline: 'Accroche modifiée.' },
    FULL_PROJECT.id,
    parseProjectCreate(FULL_PROJECT)
  );
  assert.equal(update.tagline, 'Accroche modifiée.');
  assert.equal(update.category, 'ia');
  assert.equal('id' in update, false, 'l’id ne fait pas partie de la mise à jour');
});

test('les valeurs hors énumération sont rejetées', () => {
  for (const invalidFields of [
    { category: 'autre' },
    { category: 'IA' },
    { category: '' },
    { status: 'abandonne' },
    { status: 3 },
  ]) {
    assert.throws(() => parseProjectCreate({ ...FULL_PROJECT, ...invalidFields }), {
      status: 400,
    });
  }
});

test('repoUrl n’accepte que des URL HTTPS absolues', () => {
  for (const repoUrl of [
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'http://github.com/exemple/depot',
    'data:text/html,<script>alert(1)</script>',
    '/projets/interne',
    '//evil.example/depot',
    'https://utilisateur:secret@github.com/exemple/depot',
  ]) {
    assert.throws(
      () => parseProjectCreate({ ...FULL_PROJECT, repoUrl }),
      { status: 400 },
      `${repoUrl} doit être refusé`
    );
  }
  assert.equal(
    parseProjectCreate({ ...FULL_PROJECT, repoUrl: '' }).repoUrl,
    undefined,
    'une URL vide efface le lien'
  );
});

test('les chiffres refusent les clés en trop et les valeurs trop longues', () => {
  assert.throws(
    () =>
      parseProjectCreate({
        ...FULL_PROJECT,
        stats: [{ label: 'Commits', value: '488', href: 'https://evil.example' }],
      }),
    { status: 400 }
  );
  for (const stats of [
    [{ label: 'x'.repeat(33), value: '1' }],
    [{ label: 'Commits', value: 'x'.repeat(33) }],
    [{ label: 'Commits' }],
    [{ label: '   ', value: '1' }],
    ['488'],
    Array.from({ length: 7 }, (_, index) => ({ label: `Stat ${index}`, value: '1' })),
    { label: 'Commits', value: '488' },
  ]) {
    assert.throws(() => parseProjectCreate({ ...FULL_PROJECT, stats }), {
      status: 400,
    });
  }
});

test('les textes et listes de console respectent leurs limites', () => {
  for (const invalidFields of [
    { shortTitle: 'x'.repeat(31) },
    { tagline: 'x'.repeat(161) },
    { role: 'x'.repeat(121) },
    { period: 'x'.repeat(61) },
    { tagline: 42 },
    { highlights: Array.from({ length: 9 }, () => 'Point') },
    { highlights: ['x'.repeat(301)] },
    { highlights: ['Point', '  '] },
    { isPrivate: 'false' },
    { order: -1 },
    { order: 1001 },
    { order: 1.5 },
  ]) {
    assert.throws(
      () => parseProjectCreate({ ...FULL_PROJECT, ...invalidFields }),
      { status: 400 },
      `${JSON.stringify(invalidFields).slice(0, 60)} doit être refusé`
    );
  }
  const parsed = parseProjectCreate({
    ...FULL_PROJECT,
    shortTitle: 'x'.repeat(30),
    tagline: 'x'.repeat(160),
    highlights: Array.from({ length: 8 }, () => 'x'.repeat(300)),
    stats: Array.from({ length: 6 }, () => ({ label: 'x'.repeat(32), value: 'y'.repeat(32) })),
    order: 1000,
  });
  assert.equal(parsed.highlights?.length, 8);
  assert.equal(parsed.stats?.length, 6);
});

test('une mise à jour partielle peut effacer un texte facultatif', () => {
  const update = parseProjectUpdate(
    { tagline: '   ' },
    FULL_PROJECT.id,
    parseProjectCreate(FULL_PROJECT)
  );
  assert.equal('tagline' in update, true);
  assert.equal(update.tagline, undefined);
});
