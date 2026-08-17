const setTokenCookie = (token: string, key: string = "f-a-t"): void => {
  const now = new Date();
  now.setTime(now.getTime() + 24 * 60 * 60 * 1000);
  const expires = "expires=" + now.toUTCString();
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? ";Secure" : "";

  document.cookie = `${key}=${encodeURIComponent(token)};${expires};path=/;SameSite=Lax${secure}`;
};

const deleteTokenCookie = (key: string = "f-a-t"): void => {
  const expires = "expires=Thu, 01 Jan 1970 00:00:00 UTC";

  document.cookie = `${key}=;${expires};path=/;SameSite=Lax`;
};

export { setTokenCookie, deleteTokenCookie };
