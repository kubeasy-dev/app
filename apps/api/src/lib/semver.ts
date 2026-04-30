const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/;

function parse(version: string): [number, number, number] | null {
  const m = SEMVER_RE.exec(version.trim());
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function compareSemver(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return Number.NaN;
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

export function isAtLeast(version: string, minVersion: string): boolean {
  const cmp = compareSemver(version, minVersion);
  return Number.isNaN(cmp) ? false : cmp >= 0;
}
