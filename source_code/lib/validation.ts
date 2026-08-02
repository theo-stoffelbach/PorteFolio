import { ApiRequestError } from '@/lib/apiSecurity';
import { Experience, Formation, Project, ProjectPhase } from '@/lib/types';

type UnknownRecord = Record<string, unknown>;
type Rule =
  | { kind: 'string'; max: number; required?: boolean }
  | { kind: 'id'; required?: boolean }
  | { kind: 'integer'; min: number; max: number; required?: boolean }
  | { kind: 'boolean' }
  | { kind: 'strings'; maxItems: number; maxLength: number; required?: boolean }
  | {
      kind: 'url';
      required?: boolean;
      localOnly?: boolean;
      allowEmpty?: boolean;
    }
  | { kind: 'color'; required?: boolean }
  | { kind: 'weeks'; required?: boolean }
  | { kind: 'phases' };

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

function parseString(value: unknown, key: string, max: number): string {
  if (typeof value !== 'string') invalid(`${key} doit être une chaîne`);
  const result = value.trim();
  if (!result || result.length > max) {
    invalid(`${key} doit contenir entre 1 et ${max} caractères`);
  }
  return result;
}

function parseOptionalString(value: unknown, key: string, max: number): string {
  if (typeof value !== 'string') invalid(`${key} doit être une chaîne`);
  const result = value.trim();
  if (result.length > max) invalid(`${key} ne doit pas dépasser ${max} caractères`);
  return result;
}

function parseStrings(
  value: unknown,
  key: string,
  maxItems: number,
  maxLength: number
): string[] {
  if (!Array.isArray(value) || value.length > maxItems) {
    invalid(`${key} doit être un tableau de ${maxItems} éléments maximum`);
  }
  return value.map((item) => {
      if (typeof item !== 'string') invalid(`${key} doit contenir des chaînes`);
      const result = item.trim();
      if (!result) invalid(`${key} ne doit pas contenir d'élément vide`);
      if (result.length > maxLength) {
        invalid(`Un élément de ${key} dépasse ${maxLength} caractères`);
      }
      return result;
    });
}

function parseUrl(
  value: unknown,
  key: string,
  required = false,
  localOnly = false,
  allowEmpty = false
): string {
  const result = parseOptionalString(value, key, 2048);
  if (!result) {
    if (required && !allowEmpty) invalid(`${key} est requis`);
    return result;
  }
  if (
    result.startsWith('/') &&
    !result.startsWith('//') &&
    !result.includes('\\')
  ) {
    return result;
  }
  if (localOnly) invalid(`${key} doit être un chemin local`);

  try {
    const url = new URL(result);
    if (url.protocol !== 'https:' || url.username || url.password) {
      invalid(`${key} doit être une URL HTTPS ou un chemin local`);
    }
    return url.toString();
  } catch {
    invalid(`${key} doit être une URL HTTPS ou un chemin local`);
  }
}

function parseWeeks(value: unknown): number[] {
  if (!Array.isArray(value) || value.length > 52) {
    invalid('weeks doit être un tableau de 52 éléments maximum');
  }
  const weeks = value.map((week) => {
    if (!Number.isInteger(week) || week < 1 || week > 52) {
      invalid('Chaque semaine doit être comprise entre 1 et 52');
    }
    return week as number;
  });
  return [...new Set(weeks)].sort((a, b) => a - b);
}

function parsePhases(value: unknown): ProjectPhase[] {
  if (!Array.isArray(value) || value.length > 52) {
    invalid('phases doit être un tableau de 52 éléments maximum');
  }
  return value.map((item) => {
    const phase = asRecord(item);
    const unknown = Object.keys(phase).find(
      (key) => !['week', 'phase', 'description', 'emoji'].includes(key)
    );
    if (unknown) invalid(`Champ de phase non autorisé: ${unknown}`);
    if (!Number.isInteger(phase.week) || (phase.week as number) < 1 || (phase.week as number) > 52) {
      invalid('La semaine de phase doit être comprise entre 1 et 52');
    }
    return {
      week: phase.week as number,
      phase: parseString(phase.phase, 'phase', 200),
      description:
        phase.description === undefined
          ? undefined
          : parseOptionalString(phase.description, 'description', 2000),
      emoji:
        phase.emoji === undefined
          ? undefined
          : parseOptionalString(phase.emoji, 'emoji', 20),
    };
  });
}

function validateProjectSchedule(project: Partial<Project>): void {
  if (project.phases === undefined) return;

  const phaseWeeks = new Set<number>();
  for (const phase of project.phases) {
    if (phaseWeeks.has(phase.week)) {
      invalid(`Une seule phase est autorisée pour la semaine ${phase.week}`);
    }
    phaseWeeks.add(phase.week);
    if (project.weeks !== undefined && !project.weeks.includes(phase.week)) {
      invalid(`La phase de la semaine ${phase.week} doit appartenir à weeks`);
    }
  }
}

function parseWithSchema(
  value: unknown,
  schema: Record<string, Rule>,
  partial: boolean,
  expectedId?: string
): UnknownRecord {
  const source = asRecord(value);
  const unknown = Object.keys(source).find((key) => !schema[key]);
  if (unknown) invalid(`Champ non autorisé: ${unknown}`);

  const result: UnknownRecord = {};
  for (const [key, rule] of Object.entries(schema)) {
    const field = source[key];
    if (field === undefined) {
      if (!partial && 'required' in rule && rule.required) {
        invalid(`${key} est requis`);
      }
      continue;
    }

    switch (rule.kind) {
      case 'string':
        result[key] = rule.required
          ? parseString(field, key, rule.max)
          : parseOptionalString(field, key, rule.max);
        break;
      case 'id': {
        const id = parseString(field, key, 100);
        if (!ID_PATTERN.test(id)) {
          invalid('id contient des caractères non autorisés');
        }
        if (partial && id !== expectedId) invalid('id ne peut pas être modifié');
        if (!partial) result[key] = id;
        break;
      }
      case 'integer':
        if (!Number.isInteger(field) || (field as number) < rule.min || (field as number) > rule.max) {
          invalid(`${key} doit être compris entre ${rule.min} et ${rule.max}`);
        }
        result[key] = field;
        break;
      case 'boolean':
        if (typeof field !== 'boolean') invalid(`${key} doit être un booléen`);
        result[key] = field;
        break;
      case 'strings':
        result[key] = parseStrings(field, key, rule.maxItems, rule.maxLength);
        break;
      case 'url':
        result[key] = parseUrl(
          field,
          key,
          rule.required,
          rule.localOnly,
          rule.allowEmpty
        );
        break;
      case 'color': {
        const color = parseString(field, key, 7);
        if (!COLOR_PATTERN.test(color)) invalid('color doit être au format #RRGGBB');
        result[key] = color;
        break;
      }
      case 'weeks':
        result[key] = parseWeeks(field);
        break;
      case 'phases':
        result[key] = parsePhases(field);
        break;
    }
  }

  if (partial && Object.keys(result).length === 0) {
    invalid('Aucun champ modifiable fourni');
  }
  return result;
}

function parseProject(
  value: unknown,
  partial: boolean,
  id?: string
): Project | Partial<Project> {
  const project = parseWithSchema(
    value,
    projectSchema,
    partial,
    id
  ) as Partial<Project>;
  validateProjectSchedule(project);
  return project;
}

const projectSchema: Record<string, Rule> = {
  id: { kind: 'id', required: true },
  title: { kind: 'string', max: 200, required: true },
  description: { kind: 'string', max: 5000, required: true },
  technologies: { kind: 'strings', maxItems: 50, maxLength: 100, required: true },
  // Une chaîne vide représente explicitement un projet sans image.
  imageUrl: {
    kind: 'url',
    required: true,
    localOnly: true,
    allowEmpty: true,
  },
  projectUrl: { kind: 'url' },
  color: { kind: 'color', required: true },
  weeks: { kind: 'weeks', required: true },
  phases: { kind: 'phases' },
  year: { kind: 'integer', min: 1990, max: 2100, required: true },
  featured: { kind: 'boolean' },
};

const experienceSchema: Record<string, Rule> = {
  id: { kind: 'id', required: true },
  company: { kind: 'string', max: 200, required: true },
  position: { kind: 'string', max: 200, required: true },
  duration: { kind: 'string', max: 100, required: true },
  technologies: { kind: 'strings', maxItems: 50, maxLength: 100, required: true },
  description: { kind: 'string', max: 5000, required: true },
  startDate: { kind: 'string', max: 100 },
  endDate: { kind: 'string', max: 100 },
  location: { kind: 'string', max: 200 },
  responsibilities: { kind: 'strings', maxItems: 50, maxLength: 500 },
  achievements: { kind: 'strings', maxItems: 50, maxLength: 500 },
  fullDescription: { kind: 'string', max: 20000 },
};

const formationSchema: Record<string, Rule> = {
  id: { kind: 'id', required: true },
  school: { kind: 'string', max: 200, required: true },
  period: { kind: 'string', max: 100, required: true },
  description: { kind: 'string', max: 5000, required: true },
  skills: { kind: 'strings', maxItems: 50, maxLength: 100, required: true },
};

export function parseProjectCreate(value: unknown): Project {
  return parseProject(value, false) as Project;
}

export function parseProjectUpdate(
  value: unknown,
  id: string,
  currentProject: Project
): Partial<Project> {
  const update = parseProject(value, true, id) as Partial<Project>;
  validateProjectSchedule({ ...currentProject, ...update });
  return update;
}

export function parseExperienceCreate(value: unknown): Experience {
  return parseWithSchema(value, experienceSchema, false) as unknown as Experience;
}

export function parseExperienceUpdate(
  value: unknown,
  id: string
): Partial<Experience> {
  return parseWithSchema(value, experienceSchema, true, id) as Partial<Experience>;
}

export function parseFormationCreate(value: unknown): Formation {
  return parseWithSchema(value, formationSchema, false) as unknown as Formation;
}

export function parseFormationUpdate(
  value: unknown,
  id: string
): Partial<Formation> {
  return parseWithSchema(value, formationSchema, true, id) as Partial<Formation>;
}
