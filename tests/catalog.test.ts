import assert from 'node:assert/strict';
import test from 'node:test';
import {
  inferCategory,
  sortCartridges,
  toCartridge,
  toCartridges,
} from '../lib/catalog';
import type { Project } from '../lib/types';

// Projet minimal tel que l'admin peut le créer, sans aucun champ de console.
function project(overrides: Partial<Project> = {}): Project {
  return {
    id: 'projet-test',
    title: 'Projet test',
    description: 'Première phrase du projet. Seconde phrase plus détaillée.',
    technologies: [],
    imageUrl: '',
    color: '#123456',
    weeks: [1],
    year: 2026,
    ...overrides,
  };
}

test('toCartridge garde la catégorie fournie quand elle est connue', () => {
  assert.equal(
    toCartridge(project({ category: 'jeux', technologies: ['Docker'] })).category,
    'jeux'
  );
});

test('toCartridge déduit la catégorie du titre et des technologies', () => {
  assert.equal(
    toCartridge(project({ technologies: ['Docker', 'Nginx'] })).category,
    'infra'
  );
  assert.equal(
    toCartridge(project({ title: 'Assistant Claude', technologies: ['Python'] }))
      .category,
    'ia'
  );
  assert.equal(
    toCartridge(project({ title: 'Jeu de cartes', technologies: ['Socket.IO'] }))
      .category,
    'jeux'
  );
  assert.equal(
    toCartridge(project({ technologies: ['React', 'Express'] })).category,
    'web',
    'sans indice, la cartouche retombe sur WEB'
  );
});

test('une catégorie inconnue venue du JSON est ignorée au profit de la déduction', () => {
  const corrupted = project({
    category: 'autre' as Project['category'],
    technologies: ['Kubernetes'],
  });
  assert.equal(inferCategory(corrupted), 'infra');
});

test('toCartridge masque le lien du code quand le dépôt est privé', () => {
  const repoUrl = 'https://github.com/exemple/depot';
  const privateCart = toCartridge(project({ repoUrl, isPrivate: true }));
  assert.equal(privateCart.repoUrl, undefined);
  assert.equal(privateCart.isPrivate, true);

  const publicCart = toCartridge(project({ repoUrl, isPrivate: false }));
  assert.equal(publicCart.repoUrl, repoUrl);
  assert.equal(publicCart.isPrivate, false);

  assert.equal(
    toCartridge(project({ repoUrl })).isPrivate,
    false,
    'isPrivate absent vaut public'
  );
});

test('toCartridge complète les champs absents avec des replis lisibles', () => {
  const cart = toCartridge(project());
  assert.equal(cart.shortTitle, 'Projet test');
  assert.equal(cart.tagline, 'Première phrase du projet.');
  assert.equal(cart.status, 'termine');
  assert.deepEqual(cart.highlights, []);
  assert.deepEqual(cart.stats, []);
  assert.equal(cart.featured, false);
  assert.equal(cart.order, Number.MAX_SAFE_INTEGER);
  assert.equal(cart.demoUrl, undefined);

  assert.equal(
    toCartridge(project({ shortTitle: '   ', tagline: '  ' })).shortTitle,
    'Projet test',
    'un titre court vide retombe sur le titre'
  );

  const longSentence = `${'mot '.repeat(40).trim()}.`;
  const truncated = toCartridge(project({ description: longSentence })).tagline;
  assert.equal(truncated.length, 118);
  assert.ok(truncated.endsWith('…'));
});

test('le tri place les projets mis en avant, puis l’ordre manuel, puis les plus récents', () => {
  const cartridges = toCartridges([
    project({ id: 'ancien', title: 'Ancien', year: 2023 }),
    project({ id: 'second', title: 'Second', featured: true, order: 2 }),
    project({ id: 'recent', title: 'Récent', year: 2026 }),
    project({ id: 'premier', title: 'Premier', featured: true, order: 1 }),
    project({ id: 'ordonne', title: 'Ordonné', order: 3, year: 2022 }),
    project({ id: 'alpha', title: 'Alpha', year: 2026 }),
  ]);
  assert.deepEqual(
    cartridges.map(({ id }) => id),
    ['premier', 'second', 'ordonne', 'alpha', 'recent', 'ancien']
  );
});

test('sortCartridges ne modifie pas la liste reçue', () => {
  const input = [
    toCartridge(project({ id: 'b', title: 'B' })),
    toCartridge(project({ id: 'a', title: 'A', featured: true })),
  ];
  const sorted = sortCartridges(input);
  assert.deepEqual(
    input.map(({ id }) => id),
    ['b', 'a']
  );
  assert.deepEqual(
    sorted.map(({ id }) => id),
    ['a', 'b']
  );
});
