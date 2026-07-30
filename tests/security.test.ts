import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test from 'node:test';
import { NextRequest } from 'next/server';
import {
  enforceAdminMutation,
  isTrustedMutationOrigin,
  readJsonBody,
} from '../lib/apiSecurity';
import { POST as login } from '../app/api/auth/login/route';
import {
  generateToken,
  getJwtExpiresIn,
  hashPassword,
  verifyToken,
} from '../lib/auth';
import {
  clearLoginAttempts,
  consumeLoginAttempt,
  getLoginClientKey,
} from '../lib/loginRateLimit';
import { parseProjectBasicInput } from '../lib/projectForm';
import { parseProjectCreate } from '../lib/validation';
import { parseProjectBasicInput as parseSourceProjectBasicInput } from '../source_code/lib/projectForm';
import { parseProjectCreate as parseSourceProjectCreate } from '../source_code/lib/validation';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

const BASE_URL = 'https://theo-stoffelbach.fr';
const VALID_PROJECT = {
  id: 'review-test',
  title: 'Projet test',
  description: 'Description',
  technologies: ['TypeScript'],
  imageUrl: '/images/projects/test.svg',
  projectUrl: 'https://example.com/',
  color: '#123456',
  weeks: [2, 1, 2],
  year: 2026,
  featured: false,
};

function request(
  path: string,
  init: ConstructorParameters<typeof NextRequest>[1] = {}
): NextRequest {
  return new NextRequest(`${BASE_URL}${path}`, init);
}

test('les mutations n’acceptent que l’origine same-origin transmise par NPM', () => {
  const trustedHeaders = {
    origin: BASE_URL,
    host: 'theo-stoffelbach.fr',
    'x-forwarded-proto': 'https',
  };
  assert.equal(
    isTrustedMutationOrigin(
      request('/api/projects', { headers: trustedHeaders })
    ),
    true
  );
  assert.equal(
    isTrustedMutationOrigin(
      request('/api/projects', {
        headers: { ...trustedHeaders, origin: 'https://evil.example' },
      })
    ),
    false
  );
  assert.equal(
    isTrustedMutationOrigin(
      request('/api/projects', {
        headers: {
          ...trustedHeaders,
          origin: 'https://evil.example',
          'x-forwarded-host': 'evil.example',
        },
      })
    ),
    false,
    'X-Forwarded-Host ne doit jamais étendre les origines autorisées'
  );
  assert.equal(
    isTrustedMutationOrigin(
      request('/api/projects', {
        headers: { 'sec-fetch-site': 'same-origin' },
      })
    ),
    true
  );
});

test('le lecteur JSON applique le type et la limite réelle du corps', async () => {
  const valid = request('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  });
  assert.deepEqual(await readJsonBody(valid, 64), { ok: true });

  const wrongType = request('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'text/plain' },
    body: '{}',
  });
  await assert.rejects(readJsonBody(wrongType), { status: 415 });

  const jsonPrefix = request('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/jsonp' },
    body: '{}',
  });
  await assert.rejects(readJsonBody(jsonPrefix), { status: 415 });

  const malformedLength = request('/api/projects', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'content-length': '2junk',
    },
    body: '{}',
  });
  await assert.rejects(readJsonBody(malformedLength), { status: 400 });

  const oversized = request('/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ value: 'x'.repeat(100) }),
  });
  await assert.rejects(readJsonBody(oversized, 32), { status: 413 });
});

test('les erreurs JSON du login exposent encore le quota consommé', async () => {
  const response = await login(
    request('/api/auth/login', {
      method: 'POST',
      headers: {
        origin: BASE_URL,
        host: 'theo-stoffelbach.fr',
        'x-forwarded-proto': 'https',
        'x-real-ip': `test-malformed-${Date.now()}`,
        'content-type': 'text/plain',
      },
      body: '{}',
    })
  );

  assert.equal(response.status, 415);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-ratelimit-limit'), '5');
  assert.equal(response.headers.get('x-ratelimit-remaining'), '4');
  assert.ok(response.headers.get('x-ratelimit-reset'));
});

test('les JWT vérifient secret, issuer, audience et compte admin', async () => {
  process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.JWT_EXPIRES_IN = '3600';
  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD_HASH = await hashPassword('mot-de-passe-test');

  process.env.JWT_EXPIRES_IN = '3600abc';
  assert.throws(() => getJwtExpiresIn());
  process.env.JWT_EXPIRES_IN = '3600';

  const token = await generateToken(process.env.ADMIN_EMAIL);
  assert.equal((await verifyToken(token))?.email, process.env.ADMIN_EMAIL);

  process.env.ADMIN_EMAIL = 'autre@example.com';
  assert.equal(await verifyToken(token), null);
});

test('une mutation authentifiée rejette toujours une origine étrangère', async () => {
  process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.JWT_EXPIRES_IN = '3600';
  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD_HASH = await hashPassword('mot-de-passe-test');
  const token = await generateToken(process.env.ADMIN_EMAIL);

  const rejection = await enforceAdminMutation(
    request('/api/projects', {
      method: 'POST',
      headers: {
        cookie: `admin_token=${token}`,
        origin: 'https://evil.example',
        'x-forwarded-host': 'theo-stoffelbach.fr',
        'x-forwarded-proto': 'https',
      },
    })
  );
  assert.equal(rejection?.status, 403);
});

test('le rate limiter bloque la sixième tentative et se réinitialise', () => {
  const key = `test-${Date.now()}`;
  const start = 1_000_000;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal(consumeLoginAttempt(key, start).allowed, true);
  }
  assert.equal(consumeLoginAttempt(key, start).allowed, false);
  clearLoginAttempts(key);
  assert.equal(consumeLoginAttempt(key, start).allowed, true);
  clearLoginAttempts(key);
});

test('la clé client privilégie le X-Real-IP réécrit par NPM', () => {
  const headers = new Headers({
    'x-real-ip': '203.0.113.10',
    'x-forwarded-for': '198.51.100.1, 203.0.113.10',
  });
  assert.equal(getLoginClientKey(headers), '203.0.113.10');
});

test('les deux validateurs acceptent sans image mais refusent une image distante', () => {
  for (const parse of [parseProjectCreate, parseSourceProjectCreate]) {
    assert.equal(parse({ ...VALID_PROJECT, imageUrl: '' }).imageUrl, '');
    assert.equal(
      parse({ ...VALID_PROJECT, imageUrl: '/images/projects/test.svg' })
        .imageUrl,
      '/images/projects/test.svg'
    );
    assert.throws(
      () => parse({ ...VALID_PROJECT, imageUrl: 'https://example.com/test.png' }),
      { status: 400 }
    );
    assert.throws(
      () => parse({ ...VALID_PROJECT, imageUrl: '/\\evil.example/test.png' }),
      { status: 400 }
    );
    const withoutImage = { ...VALID_PROJECT } as Partial<typeof VALID_PROJECT>;
    delete withoutImage.imageUrl;
    assert.throws(() => parse(withoutImage), { status: 400 });
    assert.throws(() => parse({ ...VALID_PROJECT, year: '2026' }), {
      status: 400,
    });
  }
});

test('les deux validateurs refusent les calendriers de phases incohérents', () => {
  for (const parse of [parseProjectCreate, parseSourceProjectCreate]) {
    assert.throws(
      () =>
        parse({
          ...VALID_PROJECT,
          weeks: [1],
          phases: [{ week: 2, phase: 'Déploiement' }],
        }),
      { status: 400 }
    );
    assert.throws(
      () =>
        parse({
          ...VALID_PROJECT,
          weeks: [1],
          phases: [
            { week: 1, phase: 'Développement' },
            { week: 1, phase: 'Déploiement' },
          ],
        }),
      { status: 400 }
    );
    assert.deepEqual(
      parse({
        ...VALID_PROJECT,
        weeks: [1, 2],
        phases: [
          { week: 1, phase: 'Développement' },
          { week: 2, phase: 'Déploiement' },
        ],
      }).phases?.map(({ week }) => week),
      [1, 2]
    );
  }
});

test('les deux formulaires convertissent year en entier', () => {
  assert.equal(parseProjectBasicInput('year', 'number', '2026', false), 2026);
  assert.equal(
    parseSourceProjectBasicInput('year', 'number', '2026', false),
    2026
  );
  assert.equal(parseProjectBasicInput('featured', 'checkbox', '', true), true);
});
