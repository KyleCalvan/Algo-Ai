const RECOVERY_KEY = 'openjarvis-asset-reload-at';
const RETRY_WINDOW_MS = 60_000;

export function isAssetLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|loading (?:css )?chunk .+ failed|unable to preload css/i.test(message);
}

/** One refresh per minute per tab; persistent failures remain visible instead of looping. */
export function claimAssetReload(storage: Pick<Storage, 'getItem' | 'setItem'>, now = Date.now()): boolean {
  try {
    const last = Number(storage.getItem(RECOVERY_KEY));
    if (last > 0 && now - last < RETRY_WINDOW_MS) return false;
    storage.setItem(RECOVERY_KEY, String(now));
    return true;
  } catch {
    // Without session storage we cannot safely guard an automatic reload loop.
    return false;
  }
}

export function recoverAssetLoad(error: unknown): boolean {
  if (!isAssetLoadError(error)) return false;
  try {
    if (!claimAssetReload(window.sessionStorage)) return false;
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function installAssetRecovery() {
  window.addEventListener('vite:preloadError', (event: Event) => {
    const error = (event as Event & { payload?: unknown }).payload;
    if (recoverAssetLoad(error)) event.preventDefault();
  });
}
