import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CATEGORY_META, toCartridges } from '../lib/catalog';
import type { Project } from '../lib/types';
import {
  parseExperienceCreate,
  parseFormationCreate,
  parseProjectCreate,
} from '../lib/validation';

function readData(name: string): { raw: string; items: unknown[] } {
  const raw = readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8');
  return { raw, items: JSON.parse(raw) };
}

const projectsFile = readData('projects.json');
const experiencesFile = readData('experiences.json');
const formationsFile = readData('formations.json');
const projects = projectsFile.items as Project[];

// Données d'infrastructure ou personnelles qui ne doivent jamais être publiées.
const FORBIDDEN_PATTERNS: [string, RegExp][] = [
  ['IP privée', /\b(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/],
  ['adresse e-mail', /[\w.+-]+@[\w-]+\.[\w.]+/],
  ['domaine personnel', /stoffelbach\.(?:fr|tech)/i],
  ['chemin de volume', /\/volume\d/i],
  ['label de runner', /nas-sandbox/i],
  ['endpoint BuildKit', /buildkitd|tcp:\/\//i],
  ['hôte interne', /dedomain/i],
  ['marque du serveur', /ugreen|ugos|synology/i],
  ['réseau Docker', /\bwebnet\b|npm-public/i],
  ['reverse proxy', /nginx proxy manager/i],
  ['box FAI', /\bbbox\b|livebox|freebox/i],
  ['socket Docker', /docker\.sock/i],
  ['mode hors ligne Minecraft', /online-mode/i],
  ['téléchargement YouTube', /yt-dlp|youtube/i],
  ['marque de jeu', /smite/i],
  ['image du client', /banner\.png/i],
  ['tiers nommé', /thaok31|\blucas\b|\bethan\b|\bjordan\b|affaan/i],
  ['mot NAS', /\bnas\b/i],
];

test('les fichiers de données passent la validation de l’admin', () => {
  for (const item of projectsFile.items) parseProjectCreate(item);
  for (const item of experiencesFile.items) parseExperienceCreate(item);
  for (const item of formationsFile.items) parseFormationCreate(item);
});

test('aucune donnée interdite n’apparaît dans les fichiers publiés', () => {
  for (const [file, { raw }] of [
    ['projects.json', projectsFile],
    ['experiences.json', experiencesFile],
    ['formations.json', formationsFile],
  ] as const) {
    for (const [label, pattern] of FORBIDDEN_PATTERNS) {
      assert.doesNotMatch(raw, pattern, `${file} contient : ${label}`);
    }
  }
});

test('les projets respectent le contrat de cartouche', () => {
  const ids = projects.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length, 'les id doivent être uniques');

  for (const project of projects) {
    assert.match(project.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `${project.id} : kebab-case`);
    assert.ok(project.category, `${project.id} : catégorie manquante`);
    assert.equal(project.color, CATEGORY_META[project.category].color, `${project.id} : couleur`);
    assert.ok((project.tagline ?? '').length <= 90, `${project.id} : accroche trop longue`);
    assert.ok(project.weeks.length > 0, `${project.id} : semaines vides`);
    assert.ok(project.highlights && project.highlights.length >= 3, `${project.id} : points forts`);
    assert.ok(project.stats && project.stats.length >= 2, `${project.id} : chiffres`);
    assert.equal(project.projectUrl, undefined, `${project.id} : pas de lien de démo`);
    assert.equal(project.imageUrl, '', `${project.id} : pas d'image`);
    if (project.isPrivate) {
      assert.equal(project.repoUrl, undefined, `${project.id} : dépôt privé sans lien`);
    }

    // Étiquette de cartouche : 2 lignes de 13 caractères au plus.
    const lines: string[] = [];
    for (const word of (project.shortTitle ?? '').split(' ')) {
      const last = lines.at(-1);
      if (last !== undefined && `${last} ${word}`.length <= 13) {
        lines[lines.length - 1] = `${last} ${word}`;
      } else {
        lines.push(word);
      }
    }
    assert.ok(
      lines.length <= 2 && lines.every((line) => line.length <= 13),
      `${project.id} : étiquette ${JSON.stringify(lines)}`
    );
  }
});

test('les cinq cartouches mises en avant ouvrent la ludothèque dans l’ordre', () => {
  const cartridges = toCartridges(projects);
  assert.deepEqual(
    cartridges.filter(({ featured }) => featured).map(({ id }) => id),
    ['gmailia', 'convertisseur', 'moss-and-mayhem', 'tp-docker-cloud', 'boutique-reparation']
  );
  assert.deepEqual(
    cartridges.slice(0, 5).map(({ order }) => order),
    [1, 2, 3, 4, 5]
  );
});
