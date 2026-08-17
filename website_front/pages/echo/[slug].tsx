/* eslint-disable */
import React from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Layout from "../../components/global/Layout";
import Loader from "../../components/global/loader";
import Navigation from "../../components/global/Navigation";
import AdSlot from "../../components/global/AdSlot";
import AdvertiseCTA from "../../components/global/AdvertiseModal";
import IcoProject from "../../components/layouts/projects/Crypto/Project";
import fetchProjectById from "../../http/projects/fetchProjectById";
import { ProjectPages } from "../../staticContent/tabs";
import { ProjectDataContext } from "../../contexts/projectDataContext";
import { IProject } from "../../types/global_types";
import { buildEchoProjectSeo } from "../../helpers/seo";

interface EchoProjectPageProps {
  initialData: { isSuccess: boolean; project: IProject | any } | null;
  slug: string;
}

const EchoProjectPage = ({
  initialData,
  slug: initialSlug,
}: EchoProjectPageProps) => {
  const router = useRouter();
  const rawSlug = router.query?.slug;
  const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug) || initialSlug;

  const { data, isLoading, refetch } = useQuery(
    ["echo-project-page-v2", slug],
    () => {
      if (!slug) return;
      return fetchProjectById(
        String(slug),
        "?projectType=echo&lookup=slug"
      );
    },
    {
      enabled: Boolean(slug),
      initialData: initialData || undefined,
      refetchOnWindowFocus: false,
    }
  );

  const seo = buildEchoProjectSeo(data?.project, slug);

  if (isLoading && !data) return <Loader isVisible={true} />;

  return (
    <ProjectDataContext.Provider
      value={{ ...data?.project, refetch: () => refetch() }}
    >
      <Layout {...seo}>
        <Navigation project="crypto" pagesList={ProjectPages} />
        <IcoProject />
      </Layout>
    </ProjectDataContext.Provider>
  );
};

export const getServerSideProps: GetServerSideProps<
  EchoProjectPageProps
> = async ({ params }) => {
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;

  if (!slug) {
    return { notFound: true };
  }

  const initialData = await fetchProjectById(
    String(slug),
    "?projectType=echo&lookup=slug"
  );

  return {
    props: {
      initialData,
      slug: String(slug),
    },
  };
};

export default EchoProjectPage;
