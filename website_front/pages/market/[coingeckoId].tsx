/* eslint-disable */
import React from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Layout from "../../components/global/Layout";
import Loader from "../../components/global/loader";
import Navigation from "../../components/global/Navigation";
import CryptoMarketProject from "../../components/layouts/projects/Crypto/Project/cryptoMarketProject";
import fetchProjectById from "../../http/projects/fetchProjectById";
import { ProjectPages } from "../../staticContent/tabs";
import { ProjectDataContext } from "../../contexts/projectDataContext";
import { IProject } from "../../types/global_types";
import { buildMarketProjectSeo } from "../../helpers/seo";

interface MarketProjectPageProps {
  initialData: { isSuccess: boolean; project: IProject | any } | null;
  coingeckoId: string;
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

const MARKET_TOP_SCROLL_DELAYS = [0, 50, 120, 300, 700, 1200];

const scrollMarketPageToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });

  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

const MarketProjectPage = ({
  initialData,
  coingeckoId: initialCoingeckoId,
}: MarketProjectPageProps) => {
  const router = useRouter();
  const rawCoingeckoId = router.query?.coingeckoId;
  const coingeckoId =
    (Array.isArray(rawCoingeckoId) ? rawCoingeckoId[0] : rawCoingeckoId) ||
    initialCoingeckoId;

  const { data, isLoading, refetch } = useQuery(
    ["market-project-page-v2", coingeckoId],
    () => {
      if (!coingeckoId) return;
      return fetchProjectById(
        String(coingeckoId),
        "?projectType=market&lookup=coingeckoId"
      );
    },
    {
      enabled: Boolean(coingeckoId),
      initialData: initialData || undefined,
      refetchOnWindowFocus: false,
    }
  );

  const seo = buildMarketProjectSeo(data?.project, coingeckoId);

  useIsomorphicLayoutEffect(() => {
    if (!coingeckoId) return undefined;

    const previousScrollRestoration =
      "scrollRestoration" in window.history
        ? window.history.scrollRestoration
        : undefined;

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    scrollMarketPageToTop();

    const animationFrame = window.requestAnimationFrame(scrollMarketPageToTop);
    const timeoutIds = MARKET_TOP_SCROLL_DELAYS.map((delay) =>
      window.setTimeout(scrollMarketPageToTop, delay)
    );

    window.addEventListener("load", scrollMarketPageToTop, { once: true });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.removeEventListener("load", scrollMarketPageToTop);

      if (
        previousScrollRestoration &&
        "scrollRestoration" in window.history
      ) {
        window.history.scrollRestoration = previousScrollRestoration;
      }
    };
  }, [coingeckoId]);

  if (isLoading && !data) return <Loader isVisible={true} />;

  return (
    <ProjectDataContext.Provider
      value={{ ...data?.project, refetch: () => refetch() }}
    >
      <Layout {...seo}>
        <Navigation project="crypto" pagesList={ProjectPages} />
        <CryptoMarketProject />
      </Layout>
    </ProjectDataContext.Provider>
  );
};

export const getServerSideProps: GetServerSideProps<
  MarketProjectPageProps
> = async ({ params }) => {
  const rawCoingeckoId = params?.coingeckoId;
  const coingeckoId = Array.isArray(rawCoingeckoId)
    ? rawCoingeckoId[0]
    : rawCoingeckoId;

  if (!coingeckoId) {
    return { notFound: true };
  }

  const initialData = await fetchProjectById(
    String(coingeckoId),
    "?projectType=market&lookup=coingeckoId"
  );

  return {
    props: {
      initialData,
      coingeckoId: String(coingeckoId),
    },
  };
};

export default MarketProjectPage;
