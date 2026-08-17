/* eslint-disable */
import React, { createContext, FC } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import Person from "../../../components/layouts/projects/Persons/Person";
import { IPerson } from "../../../types/global_types";
import fetchPersonById from "../../../http/persons/fetchPersonById";
import Loader from "../../../components/global/loader";
import { buildPersonSeo } from "../../../helpers/seo";

export interface IPersonWithRefetch extends IPerson {
  refetch: () => void;
}

export const PersonDataContext = createContext<IPersonWithRefetch>({
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

interface PersonPageProps {
  initialData: { isSuccess: boolean; person: IPerson | null; status?: number } | null;
  id: string;
}

const PersonPage = ({ initialData, id: initialId }: PersonPageProps) => {
  const router = useRouter();
  const rawSlug = router.query?.id;
  const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug) || initialId;

  const { data, isLoading, refetch } = useQuery(
    ["person-page", slug],
    () => {
      return fetchPersonById(String(slug || ""));
    },
    {
      enabled: router.isReady && Boolean(slug),
      initialData: initialData || undefined,
      refetchOnWindowFocus: false,
    }
  );

  if ((!router.isReady && !slug) || (isLoading && !data)) {
    return <Loader isVisible={true} />;
  }

  const seo = buildPersonSeo(data?.person, slug);

  if (!data?.person) {
    return (
      <Layout {...seo} noIndex>
        <Navigation project="crypto" pagesList={ProjectPages} />
        <div style={{ width: 1204, maxWidth: "100%", margin: "32px auto" }}>
          {data?.status === 404 ? "Person not found" : "Unable to load person"}
        </div>
      </Layout>
    );
  }

  return (
    <PersonDataContext.Provider
      value={{ ...data?.person, refetch: () => refetch() }}
    >
      <Layout {...seo}>
        <Navigation project="crypto" pagesList={ProjectPages} />
        <Person />
      </Layout>
    </PersonDataContext.Provider>
  );
};

export const getServerSideProps: GetServerSideProps<PersonPageProps> = async ({
  params,
}) => {
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return { notFound: true };
  }

  const initialData = await fetchPersonById(String(id));

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

export default PersonPage;
