import React, { useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";

const RefPage = () => {
  const router = useRouter();

  useEffect(() => {
    const data: Array<string> | undefined | string = router.query.slug;

    if (!data) return;

    const id = data[0];
    const code = data[1];

    localStorage.setItem("fomo-inviter", id);
    localStorage.setItem("fomo-code", code);

    router.push("/invite");
  }, [router]);

  return (
    <Head>
      <title>Fomoland</title>
    </Head>
  );
};

export default RefPage;
