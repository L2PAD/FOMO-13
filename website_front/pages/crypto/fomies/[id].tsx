/* eslint-disable */
import React, { createContext } from "react";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import { IPerson } from "../../../types/global_types";
import fetchFomieByUserId from "../../../http/persons/fetchFomieByUserId";
import Loader from "../../../components/global/loader";
import Fomies from "../../../components/layouts/projects/Persons/Person/fomies";

export interface IFomiesWithRefetch extends IPerson {
  refetch: () => void;
}

export const FomiesDataContext = createContext<IFomiesWithRefetch>({
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

const FomiesPage = () => {
  const router = useRouter();
  const rawId = router.query?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const { data, isError, isLoading, refetch } = useQuery(
    ["fomies-page", id],
    () => {
      return fetchFomieByUserId(String(id || ""));
    },
    {
      enabled: router.isReady && Boolean(id),
      refetchOnWindowFocus: false,
    }
  );

  if ((!router.isReady && !id) || (isLoading && !data)) {
    return <Loader isVisible={true} />;
  }

  if (isError || !data?.person) {
    return (
      <Layout title="Fomoland: Crypto/Fomies" noIndex>
        <Navigation project="crypto" pagesList={ProjectPages} />
        <div style={{ width: 1204, maxWidth: "100%", margin: "32px auto" }}>
          {data?.status === 400 || data?.status === 404
            ? "Fomie not found"
            : "Unable to load Fomie"}
        </div>
      </Layout>
    );
  }

  return (
    <FomiesDataContext.Provider
      value={{ ...data?.person, refetch: () => refetch() }}
    >
      <Layout title="Fomoland: Crypto/Fomies">
        <Navigation project="crypto" pagesList={ProjectPages} />
        <Fomies />
      </Layout>
    </FomiesDataContext.Provider>
  );
};

export default FomiesPage;
