// Petites mémoires de session (démarrage vu, cartouches lancées, chocolatines).
// sessionStorage peut être absent ou bloqué : chaque accès est protégé, et un
// miroir en mémoire garde les compteurs justes pendant la visite même sans lui.

const PREFIX = 'ts27:';
const memory = new Map<string, string>();

function read(key: string): string | null {
  const kept = memory.get(key);
  if (kept !== undefined) return kept;
  try {
    const stored = window.sessionStorage.getItem(PREFIX + key);
    if (stored !== null) memory.set(key, stored);
    return stored;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  memory.set(key, value);
  try {
    window.sessionStorage.setItem(PREFIX + key, value);
  } catch {
    // Stockage indisponible (navigation privée, données bloquées) : le miroir suffit.
  }
}

export function hasBooted(): boolean {
  return read('boot') === '1';
}

export function markBooted(): void {
  write('boot', '1');
}

export function readPlayed(): string[] {
  try {
    const parsed: unknown = JSON.parse(read('played') ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function addPlayed(id: string): string[] {
  const played = readPlayed();
  if (!played.includes(id)) played.push(id);
  write('played', JSON.stringify(played));
  return played;
}

export function readChocolatines(): number {
  const n = Number.parseInt(read('chocolatines') ?? '0', 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function eatChocolatine(): number {
  const n = readChocolatines() + 1;
  write('chocolatines', String(n));
  return n;
}
