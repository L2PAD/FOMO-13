/* eslint-disable */

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";

export default function AuthTwitter() {
  const router = useRouter();
  const params = router.query;
  const handledRef = useRef(false);

  useEffect(() => {
    const twitterAuth = async () => {
      const status = Array.isArray(params.status)
        ? params.status[0]
        : params.status;
      const reason = Array.isArray(params.reason)
        ? params.reason[0]
        : params.reason;
      const errorText = Array.isArray(params.errorText)
        ? params.errorText[0]
        : params.errorText;

      if (status === "success") {
        router.replace("/?auth=twitter&success=true");
        return;
      }

      if (status === "error") {
        const message = errorText || reason || "callback_failed";
        router.replace(
          `/?auth=twitter&error=true&errorText=${encodeURIComponent(message)}`
        );
        return;
      }

      router.replace(
        "/?auth=twitter&error=true&errorText=invalid_callback"
      );
    };
    if (router.isReady && !handledRef.current) {
      handledRef.current = true;
      twitterAuth();
    }
  }, [params, router]);

  return <></>;
}
