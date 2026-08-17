import type { NextRouter } from "next/router";

const AUTH_MODAL_QUERY_KEY = "auth-modal";

export const openAuthModal = (router: NextRouter): void => {
  router.replace(
    {
      pathname: router.pathname,
      query: {
        ...router.query,
        [AUTH_MODAL_QUERY_KEY]: "true",
      },
    },
    undefined,
    { shallow: true }
  );
};
