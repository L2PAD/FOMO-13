import React, { ComponentType, useEffect } from "react";
import { useRouter } from "next/router";
import { API } from "../config/api";

const AUTH_MODAL_REDIRECT = "/?auth-modal=true";

const isSafeReturnTo = (value?: string): value is string => {
  return Boolean(value && value.startsWith("/") && !value.startsWith("//"));
};

const parseCookies = (cookieHeader = ""): Record<string, string> => {
  return cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .reduce((acc, item) => {
      const separatorIndex = item.indexOf("=");

      if (separatorIndex === -1) {
        return acc;
      }

      const key = item.slice(0, separatorIndex).trim();
      const value = item.slice(separatorIndex + 1).trim();

      acc[key] = decodeURIComponent(value);

      return acc;
    }, {} as Record<string, string>);
};

const getAuthRedirect = (returnTo?: string) => {
  const destination = isSafeReturnTo(returnTo)
    ? `${AUTH_MODAL_REDIRECT}&returnTo=${encodeURIComponent(returnTo)}`
    : AUTH_MODAL_REDIRECT;

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};

const isAuthorizedUser = (user: any): boolean => {
  // A wallet-authenticated + activated account is authorized even without an
  // email (email confirmation can be skipped when no SMTP is configured).
  return Boolean(user?.isActive && user?.wallet);
};

const getClientAuthToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const cookies = parseCookies(document.cookie || "");

  return cookies["f-a-t"] || window.localStorage.getItem("fomo-token");
};

const getCurrentReturnTo = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const withWalletPageProtection = <P extends Record<string, unknown> = Record<string, unknown>>(
  getPageProps?: (context: any) => Promise<any>
) => {
  return async (context: any) => {
    // AUTH DISABLED (dev/preview): wallet-page authorization is turned off so the
    // frontend can be worked on freely. No redirect — always render the page.
    if (!getPageProps) {
      return { props: {} as P };
    }

    return getPageProps(context);
  };
};

export const withWalletPageGuard = <P extends object>(PageComponent: ComponentType<P>) => {
  // AUTH DISABLED (dev/preview): no client-side auth check/redirect.
  const GuardedPage = (props: P) => {
    return <PageComponent {...props} />;
  };

  const displayName = PageComponent.displayName || PageComponent.name || "Page";

  GuardedPage.displayName = `withWalletPageGuard(${displayName})`;

  return GuardedPage;
};
