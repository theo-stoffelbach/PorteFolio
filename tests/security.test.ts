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
import { readJsonBody as readSourceJsonBody } from '../source_code/lib/apiSecurity';
import { POST as login } from '../app/api/auth/login/route';
import { middleware } from '../middleware';
import {
  assertJwtConfiguration,
  generateToken,
  getJwtExpiresIn,
  hashPassword,
  verifyToken,
} from '../lib/auth';
import {
  assertJwtConfiguration as assertSourceJwtConfiguration,
  verifyToken as verifySourceToken,
} from '../source_code/lib/jwt';
import { buildContentSecurityPolicy } from '../lib/securityHeaders';
import { buildContentSecurityPolicy as buildSourceContentSecurityPolicy } from '../source_code/lib/securityHeaders';
import {
  clearLoginAttempts,
  consumeLoginAttempt,
  getLoginClientKey,
  LOGIN_RATE_LIMIT_MAX_BUCKETS,
} from '../lib/loginRateLimit';
import {
  mergeActivePhaseEdits,
  parseProjectBasicInput,
  uniqueSortedPhaseWeeks,
} from '../lib/projectForm';
import {
  parseProjectCreate,
  parseProjectUpdate,
} from '../lib/validation';
import {
  mergeActivePhaseEdits as mergeSourceActivePhaseEdits,
  parseProjectBasicInput as parseSourceProjectBasicInput,
  uniqueSortedPhaseWeeks as uniqueSortedSourcePhaseWeeks,
} from '../source_code/lib/projectForm';
import {
  parseProjectCreate as parseSourceProjectCreate,
  parseProjectUpdate as parseSourceProjectUpdate,
} from '../source_code/lib/validation';
import {
  clearLoginAttempts as clearSourceLoginAttempts,
  consumeLoginAttempt as consumeSourceLoginAttempt,
  getLoginClientKey as getSourceLoginClientKey,
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

  for (const readBody of [readJsonBody, readSourceJsonBody]) {
    const rejectingStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1, 2]));
      },
      cancel() {
        throw new Error("l'annulation de la source a échoué");
      },
    });
    const rejectingCancelRequest = {
      headers: new Headers({ 'content-type': 'application/json' }),
      body: rejectingStream,
    } as NextRequest;
    await assert.rejects(readBody(rejectingCancelRequest, 1), { status: 413 });
  }
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
  for (const verify of [verifyToken, verifySourceToken]) {
    assert.equal((await verify(token))?.email, process.env.ADMIN_EMAIL);
  }

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

  const invalidTokens = [
    [
      await signTestToken('abcdef0123456789abcdef0123456789'),
      'un autre secret',
    ],
    [
      await signTestToken(process.env.JWT_SECRET, 'wrong-issuer'),
      'un issuer inattendu',
    ],
    [
      await signTestToken(
        process.env.JWT_SECRET,
        'portefolio-admin',
        'wrong-audience'
      ),
      'une audience inattendue',
    ],
  ] as const;

  for (const verify of [verifyToken, verifySourceToken]) {
    for (const [invalidToken, reason] of invalidTokens) {
      assert.equal(await verify(invalidToken), null, `${reason} doit être rejeté`);
    }
  }

  process.env.ADMIN_EMAIL = 'autre@example.com';
  assert.equal(await verifyToken(token), null);
  assert.equal(await verifySourceToken(token), null);

  delete process.env.ADMIN_EMAIL;
  assert.throws(assertJwtConfiguration, /ADMIN_EMAIL/);
  assert.throws(assertSourceJwtConfiguration, /ADMIN_EMAIL/);
});

test('le middleware refuse les jetons absents ou mal configurés sans lever', async (t) => {
  preserveAuthEnvironment(t);
  process.env.JWT_SECRET = '0123456789abcdef0123456789abcdef';
  process.env.JWT_EXPIRES_IN = '3600';
  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD_HASH = await hashPassword('mot-de-passe-test');
  const token = await generateToken(process.env.ADMIN_EMAIL);

  const authenticated = await middleware(
    request('/admin', { headers: { cookie: `admin_token=${token}` } })
  );
  assert.equal(authenticated.headers.get('x-middleware-next'), '1');

  const anonymous = await middleware(request('/admin'));
  assert.equal(anonymous.status, 307);
  assert.equal(anonymous.headers.get('location'), `${BASE_URL}/login`);

  const apiAnonymous = await middleware(
    request('/api/projects', { method: 'POST' })
  );
  assert.equal(apiAnonymous.status, 401);
  assert.equal(apiAnonymous.headers.get('cache-control'), 'no-store');

  delete process.env.JWT_SECRET;
  const misconfigured = await middleware(
    request('/admin', { headers: { cookie: `admin_token=${token}` } })
  );
  assert.equal(misconfigured.status, 307);
  assert.equal(misconfigured.headers.get('location'), `${BASE_URL}/login`);
});

test('le login signale une configuration JWT incompatible', async (t) => {
  preserveAuthEnvironment(t);
  const clientKey = `test-config-${Date.now()}`;
  t.after(() => clearLoginAttempts(clientKey));
  process.env.JWT_SECRET = 'secret-trop-court';
  process.env.JWT_EXPIRES_IN = '2592000';
  process.env.ADMIN_EMAIL = 'admin@example.com';
  process.env.ADMIN_PASSWORD_HASH = await hashPassword('mot-de-passe-test');

  const response = await login(
    request('/api/auth/login', {
      method: 'POST',
      headers: {
        origin: BASE_URL,
        host: 'theo-stoffelbach.fr',
        'x-forwarded-proto': 'https',
        'x-real-ip': clientKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'mot-de-passe-test',
      }),
    })
  );

  assert.equal(response.status, 500);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-ratelimit-limit'), '5');
  assert.deepEqual(await response.json(), {
    message: 'Erreur de configuration du serveur',
  });
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

test('le rate limiter évite le verrou global tout en préservant les quotas bloqués', () => {
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
      for (let attempt = 1; attempt < 5; attempt += 1) {
        assert.equal(consume(keys[0], now).allowed, true);
      }
      assert.equal(
        consume(keys[0], now).allowed,
        false,
        `${name}: la clé de référence doit être bloquée`
      );
      assert.equal(
        consume(`${prefix}overflow`, now).allowed,
        true,
        `${name}: la capacité mémoire ne doit pas verrouiller les nouveaux clients`
      );
      assert.equal(
        consume(keys[0], now).allowed,
        false,
        `${name}: un bucket bloqué doit être préféré aux buckets peu sollicités`
      );
    } finally {
      for (const key of keys) clear(key);
      clear(`${prefix}overflow`);
    }
  }
});

test('la clé client exige le X-Real-IP réécrit par NPM', () => {
  const headers = new Headers({
    'x-real-ip': '203.0.113.10',
    'x-forwarded-for': '198.51.100.1, 203.0.113.10',
  });
  for (const getClientKey of [getLoginClientKey, getSourceLoginClientKey]) {
    assert.equal(getClientKey(headers), '203.0.113.10');
    assert.equal(
      getClientKey(
        new Headers({ 'x-forwarded-for': '198.51.100.1, 203.0.113.10' })
      ),
      'unknown-client',
      'X-Forwarded-For seul ne doit pas permettre de choisir son quota'
    );
  }
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
      () => parse({ ...VALID_PROJECT, toString: 'champ-hérité' }),
      { status: 400 }
    );
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

test('les CSP de production et développement restent distinctes', () => {
  for (const buildPolicy of [
    buildContentSecurityPolicy,
    buildSourceContentSecurityPolicy,
  ]) {
    const production = buildPolicy(true);
    assert.match(production, /upgrade-insecure-requests/);
    assert.doesNotMatch(production, /unsafe-eval/);
    assert.doesNotMatch(production, /connect-src[^;]*\bws:/);

    const development = buildPolicy(false);
    assert.match(development, /unsafe-eval/);
    assert.match(development, /connect-src 'self' ws: wss:/);
    assert.doesNotMatch(development, /upgrade-insecure-requests/);
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
  assert.equal(parseProjectBasicInput('year', 'number', '2026abc', false), 0);
  assert.equal(
    parseSourceProjectBasicInput('year', 'number', '2026abc', false),
    0
  );
});

test('les formulaires masquent les phases retirées sans perdre leur brouillon', () => {
  const previous = [
    { week: 1, phase: 'Initiale', description: 'à modifier' },
    { week: 2, phase: 'Conservée', description: 'brouillon précieux' },
  ];
  const edited = [
    { week: 1, phase: 'Modifiée', description: 'nouvelle description' },
  ];

  for (const [uniqueWeeks, mergePhases] of [
    [uniqueSortedPhaseWeeks, mergeActivePhaseEdits],
    [uniqueSortedSourcePhaseWeeks, mergeSourceActivePhaseEdits],
  ] as const) {
    assert.deepEqual(
      uniqueWeeks([{ week: 2 }, { week: 1 }, { week: 2 }]),
      [1, 2]
    );
    assert.deepEqual(mergePhases(previous, [1], edited), [previous[1], edited[0]]);
    const replacementForInactiveWeek = {
      week: 2,
      phase: 'Nouvelle phase',
      description: 'remplace le brouillon masqué',
    };
    assert.deepEqual(
      mergePhases(previous, [1], [edited[0], replacementForInactiveWeek]),
      [edited[0], replacementForInactiveWeek],
      'une phase recréée doit remplacer le brouillon inactif de la même semaine'
    );
  }
});
