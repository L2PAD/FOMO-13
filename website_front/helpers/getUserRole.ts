import getAuthToken from "../http/getAuthToken";

/**
 * Decode the role claim from the access token (JWT). Public-front helper used to
 * gate admin/moderator-only affordances (e.g. AI summary regeneration) without
 * an extra network round-trip. Returns "" when unauthenticated / unreadable.
 */
export const getUserRole = (): string => {
  try {
    const token = getAuthToken();
    if (!token) return "";
    const payload = token.split(".")[1];
    if (!payload) return "";
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      )
    );
    return String(json?.role || "").toLowerCase();
  } catch {
    return "";
  }
};

export const isStaffRole = (): boolean => {
  const role = getUserRole();
  return role === "admin" || role === "moderator";
};

// Decode the current user's id (_id) from the access token.
export const getUserId = (): string => {
  try {
    const token = getAuthToken();
    if (!token) return "";
    const payload = token.split(".")[1];
    if (!payload) return "";
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join("")
      )
    );
    return String(json?._id || json?.id || "");
  } catch {
    return "";
  }
};

export default getUserRole;
