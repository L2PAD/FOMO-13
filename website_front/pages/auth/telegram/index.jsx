/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import connectTelegram from "../../../http/user/connectTelegram";
import activateCode from "../../../http/auth/activateCode";
import getWalletToken from "../../../http/getWalletToken";

export default function AuthTelegram() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = router.query;

  const activateAccount = async () => {
    const codeValue = localStorage.getItem("fomo-code");

    const success = await activateCode(codeValue);

    localStorage.setItem("fomo-auth", success);

    success ? router.push(`/invite`) : router.push(`/invite?error=true`);
  };

  const appendQueryParam = (url, key, value) => {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}${key}=${encodeURIComponent(value)}`;
  };

  useEffect(() => {
    const telegramAuth = async () => {
      const mode = String(params?.mode || "");
      const status = String(params?.status || "");
      const redirectPath =
        localStorage.getItem("telegram-connect-redirect") || "/core/profile";

      if (status === "error" && params?.errorText) {
        localStorage.removeItem("telegram-connect-redirect");
        router.push(
          appendQueryParam(
            appendQueryParam(redirectPath, "telegram", "error"),
            "errorText",
            String(params.errorText)
          )
        );
        return;
      }

      const hasTelegramPayload = !!(params?.telegramId || params?.username);

      if (hasTelegramPayload) {
        const telegramData = {
          username: params?.username || "",
          name: params?.name || "",
          telegramId: params?.telegramId || "",
        };
        const userData = await connectTelegram(telegramData);

        localStorage.removeItem("telegram-connect-redirect");

        console.log(mode)
        if (mode === "connect") {
          router.push('/?telegram=success');
          setLoading(false);
          return;
        }

        await activateAccount();

        setLoading(false);
      }
    };

    if (router.isReady && Object.values(params).length) {
      telegramAuth();
    }
  }, [params, router.isReady]);

  return <></>;
}
