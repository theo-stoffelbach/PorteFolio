import { ApiRequestError } from '@/lib/apiSecurity';
import { Experience, Formation, Project, ProjectPhase } from '@/lib/types';

type UnknownRecord = Record<string, unknown>;

const ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function invalid(message: string): never {
  throw new ApiRequestError(message, 400);
}

function asRecord(value: unknown): UnknownRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid('Le corps JSON doit être un objet');
  }
  return value as UnknownRecord;
}

function rejectUnknownKeys(record: UnknownRecord, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  const unknownKey = Object.keys(record).find((key) => !allowed.has(key));
  if (unknownKey) {
    invalid(`Champ non autorisé: ${unknownKey}`);
  }
}

function requiredString(
  record: UnknownRecord,
  key: string,
  maxLength: number
): string {
  const value = record[key];
  if (typeof value !== 'string') {
    invalid(`${key} doit être une chaîne`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    invalid(`${key} doit contenir entre 1 et ${maxLength} caractères`);
  }
  return trimmed;
}

function optionalString(
  record: UnknownRecord,
  key: string,
  maxLength: number
): string | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    invalid(`${key} doit être une chaîne`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    invalid(`${key} ne doit pas dépasser ${maxLength} caractères`);
  }
  return trimmed;
}

function idString(record: UnknownRecord, required: boolean): string | undefined {
  const id = required
    ? requiredString(record, 'id', 100)
    : optionalString(record, 'id', 100);
  if (id !== undefined && (!id || !ID_PATTERN.test(id))) {
    invalid('id doit contenir uniquement des lettres, chiffres, tirets ou underscores');
  }
  return id;
}

function stringArray(
  record: UnknownRecord,
  key: string,
  maxItems: number,
  maxItemLength: number,
  required: boolean
): string[] | undefined {
  const value = record[key];
  if (value === undefined && !required) return undefined;
  if (!Array.isArray(value) || value.length > maxItems) {
    invalid(`${key} doit être un tableau de ${maxItems} éléments maximum`);
  }

  const result = value
    .map((item) => {
      if (typeof item !== 'string') {
        invalid(`${key} doit contenir uniquement des chaînes`);
      }
      const trimmed = item.trim();
      if (trimmed.length > maxItemLength) {
        invalid(`Un élément de ${key} dépasse ${maxItemLength} caractères`);
      }
      return trimmed;
    })
    .filter(Boolean);

  return result;
}

function integer(
  record: UnknownRecord,
  key: string,
  min: number,
  max: number,
  required: boolean
): number | undefined {
  const value = record[key];
  if (value === undefined && !required) return undefined;
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    invalid(`${key} doit être un entier compris entre ${min} et ${max}`);
  }
  return value as number;
}

function booleanValue(
  record: UnknownRecord,
  key: string
): boolean | undefined {
  const value = record[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') {
    invalid(`${key} doit être un booléen`);
  }
  return value;
}

function safeUrl(
  record: UnknownRecord,
  key: string,
  required: boolean,
  localOnly = false
): string | undefined {
  const value = optionalString(record, key, 2048);
  if (required && value === undefined) {
    invalid(`${key} est requis`);
  }
  if (value === undefined || value === '') return value;

  if (value.startsWith('/') && !value.startsWith('//')) {
    return value;
  }
  if (localOnly) {
    invalid(`${key} doit être un chemin local`);
  }

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) {
      invalid(`${key} doit être une URL HTTPS ou un chemin local`);
    }
    return url.toString();
  } catch {
    invalid(`${key} doit être une URL HTTPS ou un chemin local`);
  }
}

function weeksArray(
  record: UnknownRecord,
  required: boolean
): number[] | undefined {
  const value = record.weeks;
  if (value === undefined && !required) return undefined;
  if (!Array.isArray(value) || value.length > 52) {
    invalid('weeks doit être un tableau de 52 éléments maximum');
  }

  const weeks = value.map((week) => {
    if (!Number.isInteger(week) || week < 1 || week > 52) {
      invalid('Chaque semaine doit être un entier compris entre 1 et 52');
    }
    return week as number;
  });
  return [...new Set(weeks)].sort((a, b) => a - b);
}

function phasesArray(record: UnknownRecord): ProjectPhase[] | undefined {
  const value = record.phases;
  if (value === undefined) return undefined;
  if (!Array.isArray(value) || value.length > 52) {
    invalid('phases doit être un tableau de 52 éléments maximum');
  }

  return value.map((phaseValue) => {
    const phase = asRecord(phaseValue);
    rejectUnknownKeys(phase, ['week', 'phase', 'description', 'emoji']);
    return {
      week: integer(phase, 'week', 1, 52, true) as number,
      phase: requiredString(phase, 'phase', 200),
      description: optionalString(phase, 'description', 2000),
      emoji: optionalString(phase, 'emoji', 20),
    };
  });
}

const PROJECT_KEYS = [
  'id',
  'title',
  'description',
  'technologies',
  'imageUrl',
  'projectUrl',
  'color',
  'weeks',
  'phases',
  'year',
  'featured',
] as const;

function parseProject(
  value: unknown,
  partial: boolean,
  expectedId?: string
): Project | Partial<Project> {
  const record = asRecord(value);
  rejectUnknownKeys(record, PROJECT_KEYS);

  const suppliedId = idString(record, !partial);
  if (partial && suppliedId !== undefined && suppliedId !== expectedId) {
    invalid('id ne peut pas être modifié');
  }

  const project: Partial<Project> = {};
  if (!partial || record.id !== undefined) project.id = suppliedId as string;
  if (!partial || record.title !== undefined) {
    project.title = requiredString(record, 'title', 200);
  }
  if (!partial || record.description !== undefined) {
    project.description = requiredString(record, 'description', 5000);
  }
  if (!partial || record.technologies !== undefined) {
    project.technologies = stringArray(record, 'technologies', 50, 100, true) as string[];
  }
  if (!partial || record.imageUrl !== undefined) {
    project.imageUrl = safeUrl(record, 'imageUrl', true, true) as string;
  }
  if (record.projectUrl !== undefined) {
    project.projectUrl = safeUrl(record, 'projectUrl', false);
  }
  if (!partial || record.color !== undefined) {
    const color = requiredString(record, 'color', 7);
    if (!COLOR_PATTERN.test(color)) {
      invalid('color doit être une couleur hexadécimale au format #RRGGBB');
    }
    project.color = color;
  }
  if (!partial || record.weeks !== undefined) {
    project.weeks = weeksArray(record, true) as number[];
  }
  if (record.phases !== undefined) project.phases = phasesArray(record);
  if (!partial || record.year !== undefined) {
    project.year = integer(record, 'year', 1990, 2100, true) as number;
  }
  if (record.featured !== undefined) {
    project.featured = booleanValue(record, 'featured');
  }

  if (partial) {
    delete project.id;
    if (Object.keys(project).length === 0) {
      invalid('Aucun champ modifiable fourni');
    }
  }

  return project;
}

const EXPERIENCE_KEYS = [
  'id',
  'company',
  'position',
  'duration',
  'technologies',
  'description',
  'startDate',
  'endDate',
  'location',
  'responsibilities',
  'achievements',
  'fullDescription',
] as const;

function parseExperience(
  value: unknown,
  partial: boolean,
  expectedId?: string
): Experience | Partial<Experience> {
  const record = asRecord(value);
  rejectUnknownKeys(record, EXPERIENCE_KEYS);

  const suppliedId = idString(record, !partial);
  if (partial && suppliedId !== undefined && suppliedId !== expectedId) {
    invalid('id ne peut pas être modifié');
  }

  const experience: Partial<Experience> = {};
  if (!partial || record.id !== undefined) experience.id = suppliedId as string;
  if (!partial || record.company !== undefined) {
    experience.company = requiredString(record, 'company', 200);
  }
  if (!partial || record.position !== undefined) {
    experience.position = requiredString(record, 'position', 200);
  }
  if (!partial || record.duration !== undefined) {
    experience.duration = requiredString(record, 'duration', 100);
  }
  if (!partial || record.technologies !== undefined) {
    experience.technologies = stringArray(
      record,
      'technologies',
      50,
      100,
      true
    ) as string[];
  }
  if (!partial || record.description !== undefined) {
    experience.description = requiredString(record, 'description', 5000);
  }
  if (record.startDate !== undefined) {
    experience.startDate = optionalString(record, 'startDate', 100);
  }
  if (record.endDate !== undefined) {
    experience.endDate = optionalString(record, 'endDate', 100);
  }
  if (record.location !== undefined) {
    experience.location = optionalString(record, 'location', 200);
  }
  if (record.responsibilities !== undefined) {
    experience.responsibilities = stringArray(
      record,
      'responsibilities',
      50,
      500,
      false
    );
  }
  if (record.achievements !== undefined) {
    experience.achievements = stringArray(
      record,
      'achievements',
      50,
      500,
      false
    );
  }
  if (record.fullDescription !== undefined) {
    experience.fullDescription = optionalString(record, 'fullDescription', 20000);
  }

  if (partial) {
    delete experience.id;
    if (Object.keys(experience).length === 0) {
      invalid('Aucun champ modifiable fourni');
    }
  }

  return experience;
}

const FORMATION_KEYS = ['id', 'school', 'period', 'description', 'skills'] as const;

function parseFormation(
  value: unknown,
  partial: boolean,
  expectedId?: string
): Formation | Partial<Formation> {
  const record = asRecord(value);
  rejectUnknownKeys(record, FORMATION_KEYS);

  const suppliedId = idString(record, !partial);
  if (partial && suppliedId !== undefined && suppliedId !== expectedId) {
    invalid('id ne peut pas être modifié');
  }

  const formation: Partial<Formation> = {};
  if (!partial || record.id !== undefined) formation.id = suppliedId as string;
  if (!partial || record.school !== undefined) {
    formation.school = requiredString(record, 'school', 200);
  }
  if (!partial || record.period !== undefined) {
    formation.period = requiredString(record, 'period', 100);
  }
  if (!partial || record.description !== undefined) {
    formation.description = requiredString(record, 'description', 5000);
  }
  if (!partial || record.skills !== undefined) {
    formation.skills = stringArray(record, 'skills', 50, 100, true) as string[];
  }

  if (partial) {
    delete formation.id;
    if (Object.keys(formation).length === 0) {
      invalid('Aucun champ modifiable fourni');
    }
  }

  return formation;
}

export function parseProjectCreate(value: unknown): Project {
  return parseProject(value, false) as Project;
}

export function parseProjectUpdate(
  value: unknown,
  expectedId: string
): Partial<Project> {
  return parseProject(value, true, expectedId) as Partial<Project>;
}

export function parseExperienceCreate(value: unknown): Experience {
  return parseExperience(value, false) as Experience;
}

export function parseExperienceUpdate(
  value: unknown,
  expectedId: string
): Partial<Experience> {
  return parseExperience(value, true, expectedId) as Partial<Experience>;
}

export function parseFormationCreate(value: unknown): Formation {
  return parseFormation(value, false) as Formation;
}

export function parseFormationUpdate(
  value: unknown,
  expectedId: string
): Partial<Formation> {
  return parseFormation(value, true, expectedId) as Partial<Formation>;
}
