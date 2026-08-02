export function parseProjectBasicInput(
  name: string,
  type: string,
  value: string,
  checked: boolean
): string | number | boolean {
  if (type === 'checkbox') return checked;
  if (name === 'year') {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : 0;
  }
  return value;
}

export function uniqueSortedPhaseWeeks(
  phases: readonly { week: number }[]
): number[] {
  return [...new Set(phases.map((phase) => phase.week))].sort(
    (a, b) => a - b
  );
}

export function mergeActivePhaseEdits<T extends { week: number }>(
  previousPhases: readonly T[],
  previouslyActiveWeeks: readonly number[],
  editedActivePhases: readonly T[]
): T[] {
  const activeWeeks = new Set(previouslyActiveWeeks);
  const preservedInactivePhases = previousPhases.filter(
    (phase) => !activeWeeks.has(phase.week)
  );
  return [...preservedInactivePhases, ...editedActivePhases];
}
