import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { Game } from '../components/console/game/Game';
import { GENERIC_HINT } from '../components/console/game/content';
import { FLASH_MS } from '../components/console/game/screens';
import type { GameHost, ScreenLink } from '../components/console/game/types';
import { toCartridges } from '../lib/catalog';
import type { Experience, Formation, Project } from '../lib/types';

// Le jeu est une machine à états sans DOM : on le pilote ici comme le fait la page.
// Sous Node, sessionStorage n'existe pas : le jeu doit quand même compter juste.

function readData<T>(name: string): T[] {
  return JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8')) as T[];
}

const data = {
  cartridges: toCartridges(readData<Project>('projects.json')),
  experiences: readData<Experience>('experiences.json'),
  formations: readData<Formation>('formations.json'),
};

function setup(boot = false) {
  const calls = {
    announced: [] as string[],
    links: [] as ScreenLink[][],
    notice: 0,
  };
  const host: GameHost = {
    announce: (text) => calls.announced.push(text),
    insert: () => {},
    eject: () => {},
    links: (list) => calls.links.push(list),
    activateLink: () => {},
    notice: () => {
      calls.notice++;
    },
  };
  const game = new Game(data, host, { reducedMotion: false });
  game.start(boot);
  return { game, calls };
}

// Fait tourner la boucle du jeu (images de 1/60 s).
function run(game: Game, ms: number): void {
  for (let t = 0; t < ms; t += 1000 / 60) game.update(1000 / 60);
}

const lastLinks = (calls: { links: ScreenLink[][] }) => calls.links.at(-1)?.map((l) => l.id) ?? [];

test('START pendant le démarrage ouvre tout de suite le contact', () => {
  const { game, calls } = setup(true);
  assert.equal(game.isBooting(), true);
  game.press('start');
  assert.equal(game.isBooting(), false);
  assert.deepEqual(lastLinks(calls), ['email', 'linkedin', 'github']);
});

test('SELECT pendant le démarrage ouvre tout de suite la notice', () => {
  const { game, calls } = setup(true);
  game.press('select');
  assert.equal(calls.notice, 1);
});

test('après le facteur, Théo reste devant le facteur (pas la boulangerie)', () => {
  const { game, calls } = setup();
  game.pointer(190, 60);
  run(game, 3000);
  assert.deepEqual(lastLinks(calls), ['email', 'linkedin', 'github']);
  game.press('b');
  assert.match(calls.announced.at(-1) ?? '', /^Devant : LE FACTEUR\./);
  game.press('up');
  assert.deepEqual(lastLinks(calls), ['email', 'linkedin', 'github']);
});

test('l’écran change de génération en entrant dans un lieu, pas en naviguant', () => {
  const { game } = setup();
  game.pointer(190, 60);
  run(game, 3000);
  const contact = game.screenGeneration();
  game.press('right');
  assert.equal(game.screenGeneration(), contact, 'choix suivant : même écran');
  game.press('b');
  assert.notEqual(game.screenGeneration(), contact, 'boîte fermée : autre écran');
});

test('les chocolatines se comptent même sans sessionStorage', () => {
  const { game, calls } = setup();
  game.pointer(200, 30);
  run(game, 3000);
  game.press('a');
  const first = calls.announced.at(-1) ?? '';
  game.press('a');
  game.press('up');
  game.press('a');
  const second = calls.announced.at(-1) ?? '';
  // « ta première chocolatine » = 1, « ça te fait 2 chocolatines » = 2.
  const count = (text: string) => Number(/(\d+) chocolatines/.exec(text)?.[1] ?? 1);
  assert.equal(count(second), count(first) + 1);
});

test('en marche, seul le nom des lieux est annoncé ; la consigne vient à l’arrêt', () => {
  const { game, calls } = setup();
  game.press('a'); // ferme le mot d'accueil
  calls.announced.length = 0;
  game.hold('right', true);
  run(game, 4000);
  const walking = [...calls.announced];
  game.hold('right', false);
  run(game, 100);
  assert.ok(walking.length > 0);
  for (const text of walking) assert.match(text, /^Devant : [^.]+\.$/, text);
  assert.ok(!walking.includes(GENERIC_HINT));
  assert.ok((calls.announced.at(-1) ?? '').length > (walking.at(-1) ?? '').length, 'consigne complète à l’arrêt');
});

test('relancer la cartouche en place va droit au titre, sans flash', () => {
  const { game, calls } = setup();
  const cart = data.cartridges[0];
  game.showCartridge(cart);
  assert.ok(!(calls.announced.at(-1) ?? '').startsWith('Cartouche'), 'flash d’abord');
  run(game, FLASH_MS + 50);
  assert.match(calls.announced.at(-1) ?? '', /^Cartouche /);
  game.press('a');
  game.showCartridge(cart, false);
  assert.match(calls.announced.at(-1) ?? '', /^Cartouche /);
});
