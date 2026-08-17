/* eslint-disable */
import React, { FC, createContext } from "react";
import { GetServerSideProps } from "next";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import { IFund } from "../../../types/global_types";
import Layout from "../../../components/global/Layout";
import Fund from "../../../components/layouts/projects/Funds/Fund";
import fetchFundById from "../../../http/funds/fetchFundById";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Loader from "../../../components/global/loader";
import { buildFundSeo } from "../../../helpers/seo";

export interface IFundWithRefetch extends IFund {
  refetch: () => void;
}

export const FundDataContext = createContext<IFundWithRefetch>({
  name: "",
  status: "Active",
  niche: "",
  totalRaised: "",
  rating: "",
  fullness: "",
  banner: "",
  lastFunding: new Date(),
  investors: [],
  refetch: () => {},
});

interface FundPageProps {
  initialData: { isSuccess: boolean; fund: IFund | null; status?: number } | null;
  id: string;
}

const FundPage = ({ initialData, id: initialId }: FundPageProps) => {
  const router = useRouter();
  const rawId = router.query?.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId) || initialId;

  const { data, isLoading, refetch } = useQuery(
    ["fund-page", id],
    () => {
      return fetchFundById(String(id || ""));
    },
    {
      enabled: router.isReady && Boolean(id),
      initialData: initialData || undefined,
      refetchOnWindowFocus: false,
    }
  );

  if ((!router.isReady && !id) || (isLoading && !data)) {
    return <Loader isVisible={true} />;
  }

  const seo = buildFundSeo(data?.fund, id);

  if (!data?.fund) {
    return (
      <Layout {...seo} noIndex>
        <Navigation project="crypto" pagesList={ProjectPages} />
        <div style={{ width: 1204, maxWidth: "100%", margin: "32px auto" }}>
          {data?.status === 404 ? "Fund not found" : "Unable to load fund"}
        </div>
      </Layout>
    );
  }

  return (
    <FundDataContext.Provider value={{ ...data.fund, refetch }}>
      <Layout {...seo}>
        <Navigation project="crypto" pagesList={ProjectPages} />
        <Fund />
      </Layout>
    </FundDataContext.Provider>
  );
};

export const getServerSideProps: GetServerSideProps<FundPageProps> = async ({
  params,
}) => {
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return { notFound: true };
  }

  const initialData = await fetchFundById(String(id));

  if (initialData?.status === 404) {
    return { notFound: true };
  }

  return {
    props: {
      initialData,
      id: String(id),
    },
  };
};

export default FundPage;
