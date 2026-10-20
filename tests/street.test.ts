import assert from 'node:assert/strict';
import test from 'node:test';
import { PLACES, placeAt } from '../components/console/game/street';

// Après un clic sur un lieu, Théo marche jusqu'à son point d'arrêt : il doit
// alors se trouver devant ce même lieu (bon onglet, bonne annonce, ↑ ou A y entre).
test('le point d’arrêt de chaque lieu est dans sa propre zone', () => {
  for (const place of PLACES) {
    assert.equal(placeAt(place.spot)?.id, place.id, `${place.id} : arrêt à x=${place.spot}`);
  }
});
