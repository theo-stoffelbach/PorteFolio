import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import * as content from '../components/console/game/content';
import { BF, SF, glyphFor, normalizeText, type BitmapFont } from '../components/console/pixel/fonts';
import { SITE } from '../lib/site';

// Tout texte dessiné sur l'écran LCD passe par les polices bitmap : un caractère
// sans glyphe s'afficherait « ? ». On vérifie donc toutes les chaînes publiées.

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const item of value) strings(item, out);
  else if (value && typeof value === 'object') for (const item of Object.values(value)) strings(item, out);
  return out;
}

function missing(font: BitmapFont, texts: readonly string[]): string[] {
  const fallback = glyphFor(font, '?');
  const found = new Set<string>();
  for (const text of texts) {
    const prepared = font.upper ? normalizeText(text).toUpperCase() : normalizeText(text);
    for (const ch of prepared) {
      if (ch === ' ' || ch === '\n' || ch === '?') continue;
      if (glyphFor(font, ch) === fallback) found.add(ch);
    }
  }
  return [...found];
}

const dataTexts = ['projects.json', 'experiences.json', 'formations.json'].flatMap((name) =>
  strings(JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8')))
);

const gameTexts = [
  ...strings(SITE),
  ...strings(Object.values(content).filter((v) => typeof v !== 'function')),
  ...(['facteur', 'boulangerie', 'ludotheque', 'poste', 'ecole', 'sii', 'serveur', 'garonne'] as const).map((id) =>
    content.placeHint(id, 3)
  ),
  ...content.bakeryParagraphs(1),
  ...content.bakeryParagraphs(4),
];

for (const [name, font] of [
  ['BF (5×7)', BF],
  ['SF (3×5)', SF],
] as const) {
  test(`la police ${name} dessine tous les caractères des données publiées`, () => {
    assert.deepEqual(missing(font, dataTexts), []);
  });

  test(`la police ${name} dessine tous les textes du jeu`, () => {
    assert.deepEqual(missing(font, gameTexts), []);
  });
}
