import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { serviceLead } from '../components/notice/content';
import { CAT_HEX, CATEGORY_META, CATEGORY_ORDER } from '../lib/catalog';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

function token(name: string): string | undefined {
  return new RegExp(`--${name}:\\s*(#[0-9a-f]{6})\\s*;`, 'i').exec(css)?.[1].toLowerCase();
}

// La console (CAT_HEX), les données (CATEGORY_META.color) et la notice (jetons
// --cat-* de globals.css) doivent montrer exactement les mêmes couleurs.
test('les jetons CSS de catégorie suivent CAT_HEX', () => {
  for (const k of CATEGORY_ORDER) {
    assert.equal(token(`cat-${k}`), CAT_HEX[k].b, `--cat-${k}`);
    assert.equal(token(`cat-${k}-deep`), CAT_HEX[k].s, `--cat-${k}-deep`);
    assert.equal(token(`cat-${k}-light`), CAT_HEX[k].h, `--cat-${k}-light`);
    assert.equal(CATEGORY_META[k].color, CAT_HEX[k].b, `CATEGORY_META.${k}.color`);
  }
});

test('l’accroche du service après-vente garde ses espaces', () => {
  assert.match(serviceLead(), /à Toulouse ou en remote \?/);
});
