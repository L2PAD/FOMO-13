export default (): string | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const cookieString = document.cookie;
  const cookies = cookieString.split(";");

  for (const cookie of cookies) {
    const [name, value] = cookie.split("=").map((c) => c.trim());
    if (name === "f-a-t") {
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
  }

  if (typeof window !== "undefined") {
    return localStorage.getItem("fomo-token");
  }

  return null;
};
