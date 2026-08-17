/** Decode the admin JWT stored in localStorage (client-side, no verification). */
export interface AdminJwt {
  _id?: string;
  email?: string;
  wallet?: string;
  role?: string[] | string;
  [k: string]: any;
}

export function decodeAdminJwt(): AdminJwt | null {
  try {
    const token = localStorage.getItem('fomoAccessToken') || '';
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** The wallet address linked to the currently logged-in admin (lowercase), '' if none. */
export function getAdminWallet(): string {
  const jwt = decodeAdminJwt();
  return String(jwt?.wallet || '').toLowerCase();
}
