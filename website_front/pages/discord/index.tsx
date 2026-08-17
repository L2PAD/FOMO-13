/* eslint-disable */
import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import updateUser from "../../http/user/updateUser";

export default function discord() {
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const params = router.query;

  useEffect(() => {
    if (params.status === "error" && params?.errorText) {
      router.push(`/invite?error=true&errorText=${params.errorText}`);
      return;
    }

    const discordAuth = async () => {
      if (Object.values(params).length) {
        const userData = await updateUser({ discordData: params });
        localStorage.setItem("fomo-user", JSON.stringify(userData));

        setLoading(false);
        if (userData) {
          router.push("/invite");
        }
      }
    };
    discordAuth();
  }, [params]);

  return <></>;
}
