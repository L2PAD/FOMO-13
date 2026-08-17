export default () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("fomo-token");
};
