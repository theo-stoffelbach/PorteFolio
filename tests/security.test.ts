import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import test, { type TestContext } from 'node:test';
import { SignJWT } from 'jose';
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
  LOGIN_RATE_LIMIT_MAX_BUCKETS,
} from '../lib/loginRateLimit';
import { parseProjectBasicInput } from '../lib/projectForm';
import {
  parseProjectCreate,
  parseProjectUpdate,
} from '../lib/validation';
import { parseProjectBasicInput as parseSourceProjectBasicInput } from '../source_code/lib/projectForm';
import {
  parseProjectCreate as parseSourceProjectCreate,
  parseProjectUpdate as parseSourceProjectUpdate,
} from '../source_code/lib/validation';
import {
  clearLoginAttempts as clearSourceLoginAttempts,
  consumeLoginAttempt as consumeSourceLoginAttempt,
  LOGIN_RATE_LIMIT_MAX_BUCKETS as SOURCE_LOGIN_RATE_LIMIT_MAX_BUCKETS,
} from '../source_code/lib/loginRateLimit';

if (!globalThis.crypto) {
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto });
}

const BASE_URL = 'https://theo-stoffelbach.fr';
const AUTH_ENVIRONMENT_KEYS = [
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD_HASH',
] as const;
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

function preserveAuthEnvironment(context: TestContext): void {
  const previousValues = new Map(
    AUTH_ENVIRONMENT_KEYS.map((key) => [key, process.env[key]])
  );
  context.after(() => {
    for (const [key, value] of previousValues) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
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

test('les erreurs JSON du login exposent encore le quota consommé', async (t) => {
  const clientKey = `test-malformed-${Date.now()}`;
  t.after(() => clearLoginAttempts(clientKey));
  const response = await login(
    request('/api/auth/login', {
      method: 'POST',
      headers: {
        origin: BASE_URL,
        host: 'theo-stoffelbach.fr',
        'x-forwarded-proto': 'https',
        'x-real-ip': clientKey,
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

test('les JWT vérifient secret, issuer, audience et compte admin', async (t) => {
  preserveAuthEnvironment(t);
  process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.JWT_EXPIRES_IN = '3600';
  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD_HASH = await hashPassword('mot-de-passe-test');

  process.env.JWT_EXPIRES_IN = '3600abc';
  assert.throws(() => getJwtExpiresIn());
  process.env.JWT_EXPIRES_IN = '3600';

  const token = await generateToken(process.env.ADMIN_EMAIL);
  assert.equal((await verifyToken(token))?.email, process.env.ADMIN_EMAIL);

  const signTestToken = (
    secret: string,
    issuer = 'portefolio-admin',
    audience = 'portefolio-admin-ui'
  ) =>
    new SignJWT({ email: 'admin@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + 3600)
      .sign(new TextEncoder().encode(secret));

  assert.equal(
    await verifyToken(
      await signTestToken('abcdef0123456789abcdef0123456789')
    ),
    null,
    'un token signé avec un autre secret doit être rejeté'
  );
  assert.equal(
    await verifyToken(
      await signTestToken(process.env.JWT_SECRET, 'wrong-issuer')
    ),
    null,
    'un issuer inattendu doit être rejeté'
  );
  assert.equal(
    await verifyToken(
      await signTestToken(
        process.env.JWT_SECRET,
        'portefolio-admin',
        'wrong-audience'
      )
    ),
    null,
    'une audience inattendue doit être rejetée'
  );

  process.env.ADMIN_EMAIL = 'autre@example.com';
  assert.equal(await verifyToken(token), null);
});

test('une mutation authentifiée rejette toujours une origine étrangère', async (t) => {
  preserveAuthEnvironment(t);
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

test('le rate limiter n’évince pas un quota actif quand sa capacité est pleine', () => {
  for (const [name, consume, clear, capacity] of [
    [
      'racine',
      consumeLoginAttempt,
      clearLoginAttempts,
      LOGIN_RATE_LIMIT_MAX_BUCKETS,
    ],
    [
      'source_code',
      consumeSourceLoginAttempt,
      clearSourceLoginAttempts,
      SOURCE_LOGIN_RATE_LIMIT_MAX_BUCKETS,
    ],
  ] as const) {
    const now = 2_000_000;
    const prefix = `capacity-${name}-`;
    const keys = Array.from(
      { length: capacity },
      (_, index) => `${prefix}${index}`
    );

    try {
      for (const key of keys) {
        assert.equal(consume(key, now).allowed, true);
      }
      assert.equal(
        consume(`${prefix}overflow`, now).allowed,
        false,
        `${name}: une nouvelle clé doit échouer en mode fail-closed`
      );

      for (let attempt = 1; attempt < 5; attempt += 1) {
        assert.equal(consume(keys[0], now).allowed, true);
      }
      assert.equal(
        consume(keys[0], now).allowed,
        false,
        `${name}: le bucket le plus ancien ne doit pas avoir été évincé`
      );
    } finally {
      for (const key of keys) clear(key);
      clear(`${prefix}overflow`);
    }
  }
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
    assert.throws(
      () => parse({ ...VALID_PROJECT, technologies: ['TypeScript', '   '] }),
      { status: 400 }
    );
    assert.deepEqual(
      parse({ ...VALID_PROJECT, technologies: [] }).technologies,
      []
    );
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

test('les mises à jour vérifient le calendrier après fusion avec le projet existant', () => {
  const currentProject = {
    ...VALID_PROJECT,
    weeks: [1],
    phases: [{ week: 1, phase: 'Développement' }],
  };

  for (const parse of [parseProjectUpdate, parseSourceProjectUpdate]) {
    assert.throws(
      () => parse({ weeks: [2] }, currentProject.id, currentProject),
      { status: 400 }
    );
    assert.throws(
      () =>
        parse(
          { phases: [{ week: 2, phase: 'Déploiement' }] },
          currentProject.id,
          currentProject
        ),
      { status: 400 }
    );
    assert.deepEqual(
      parse(
        {
          weeks: [1, 2],
          phases: [
            { week: 1, phase: 'Développement' },
            { week: 2, phase: 'Déploiement' },
          ],
        },
        currentProject.id,
        currentProject
      ).weeks,
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
  assert.equal(
    parseSourceProjectBasicInput('featured', 'checkbox', '', true),
    true
  );
});
