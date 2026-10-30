/** Routes reachable without sign-in (matches FEATURE_STATUS.md). */
const PUBLIC_EXACT = new Set(["/", "/start", "/login", "/privacy", "/terms", "/pricing", "/account/access"]);

const PUBLIC_PREFIXES = [
  "/hub",
  "/academy",
  "/learn",
  "/explorer",
  "/challenges",
  "/workspace",
  "/hardware",
  "/algorithms",
  "/coach",
  "/dashboard",
  "/studio",
  "/lab",
];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
