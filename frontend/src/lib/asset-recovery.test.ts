import { describe, expect, it, vi } from 'vitest';
import { claimAssetReload, isAssetLoadError } from './asset-recovery';

describe('frontend asset recovery', () => {
  it.each([
    'Failed to fetch dynamically imported module: http://localhost/assets/ModulePage-old.js',
    'error loading dynamically imported module',
    'Importing a module script failed.',
    'Loading chunk 7 failed.',
    'Unable to preload CSS for /assets/old.css',
  ])('recognizes browser asset failures: %s', message => {
    expect(isAssetLoadError(new TypeError(message))).toBe(true);
  });

  it('does not reload for unrelated application or API errors', () => {
    expect(isAssetLoadError(new Error('Failed to fetch'))).toBe(false);
    expect(isAssetLoadError(new Error('Module not found'))).toBe(false);
    expect(isAssetLoadError(undefined)).toBe(false);
  });

  it('allows one retry, persists its guard across page reloads, then allows a later update', () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); } };
    expect(claimAssetReload(storage, 100_000)).toBe(true);
    expect(claimAssetReload({ ...storage }, 100_001)).toBe(false);
    expect(claimAssetReload(storage, 159_999)).toBe(false);
    expect(claimAssetReload(storage, 160_000)).toBe(true);
  });

  it('avoids an uncontrolled retry when session storage is unavailable', () => {
    const storage = { getItem: vi.fn(() => { throw new Error('storage blocked'); }), setItem: vi.fn() };
    expect(claimAssetReload(storage)).toBe(false);
    expect(storage.setItem).not.toHaveBeenCalled();
  });
});
