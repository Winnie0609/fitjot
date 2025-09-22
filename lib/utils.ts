import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const isPlainObject = (v: unknown) =>
  v !== null &&
  typeof v === 'object' &&
  !Array.isArray(v) &&
  !(v instanceof Date);

export const deepClean = <T>(input: T): T => {
  if (Array.isArray(input)) {
    return input
      .map((item) => deepClean(item))
      .filter((item) => item !== undefined && item !== null) as unknown as T;
  }
  if (isPlainObject(input)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      if (v === undefined || v === null) continue;
      const cleaned = deepClean(v);
      if (isPlainObject(cleaned) && Object.keys(cleaned as object).length === 0)
        continue;
      out[k] = cleaned;
    }
    return out as T;
  }
  return input;
};
