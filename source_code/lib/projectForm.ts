export function parseProjectBasicInput(
  name: string,
  type: string,
  value: string,
  checked: boolean
): string | number | boolean {
  if (type === 'checkbox') return checked;
  if (name === 'year') return Number.parseInt(value, 10) || 0;
  return value;
}
