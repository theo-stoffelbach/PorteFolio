import assert from 'node:assert/strict';
import test from 'node:test';
import { SCALE, consoleScale, lcdFactor } from '../components/console/render/scale';

test('à 1440 × 900, la console paysage est à l’échelle 3 (pixels nets)', () => {
  assert.equal(consoleScale(1440, 900, 1, false), 3);
});

test('à 1280 × 800, l’échelle reste fluide au lieu de tomber à 2', () => {
  const px = consoleScale(1280, 800, 1, false);
  assert.ok(px > 2.6 && px < 2.7, `échelle ${px}`);
});

test('la console tient en largeur et en hauteur, sans défilement horizontal', () => {
  for (let width = 720; width <= 2560; width += 37) {
    for (const height of [600, 768, 900, 1080, 1440]) {
      for (const dpr of [1, 1.25, 1.5, 2]) {
        const px = consoleScale(width, height, dpr, false);
        assert.ok(px * SCALE.contentW <= width - SCALE.gutter, `${width}×${height}@${dpr} : trop large`);
        assert.ok(px <= SCALE.max, `${width}×${height}@${dpr} : au-delà du plafond`);
        if (height >= 600 && width >= 1100) {
          // La scène et le haut de l'étagère (jusqu'au nom des cartouches) tiennent dans la hauteur.
          assert.ok(px * (SCALE.stageH + SCALE.shelfRows) <= height + 1, `${width}×${height}@${dpr} : trop haute`);
        }
      }
    }
  }
});

test('la console portrait tient de 360 à 719 px de large', () => {
  for (let width = 360; width < 720; width += 7) {
    const px = consoleScale(width, 800, 2, true);
    assert.ok(px * SCALE.portraitW <= width - SCALE.gutter, `${width} px : trop large`);
  }
});

test('le tampon de l’écran couvre la densité réelle de pixels', () => {
  assert.equal(lcdFactor(3, 1), 3);
  assert.equal(lcdFactor(2.667, 1), 3);
  assert.equal(lcdFactor(3.74, 2), 6);
  assert.equal(lcdFactor(1.3, 1), 2);
});
