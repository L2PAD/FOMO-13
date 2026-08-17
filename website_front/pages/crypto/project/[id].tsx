/* eslint-disable */
import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import Project from "../../../components/layouts/projects/Crypto/Project";
import { ProjectPages } from "../../../staticContent/tabs";
import fetchProjectById from "../../../http/projects/fetchProjectById";
import CryptoMarketProject from "../../../components/layouts/projects/Crypto/Project/cryptoMarketProject";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import Loader from "../../../components/global/loader";
import { ProjectDataContext } from "../../../contexts/projectDataContext";

const CryptoMarketProjectPage = () => {
  const id: any = useRouter().query?.id;

  const { data, isLoading, refetch } = useQuery(
    ["crypto-project-page", id],
    () => {
      if (!id) return;
      return fetchProjectById(id);
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  if (isLoading) return <Loader isVisible={true} />;

  return (
    <ProjectDataContext.Provider
      value={{ ...data?.project, refetch: () => refetch() }}
    >
      <Layout title="Fomoland: Project">
        <Navigation project="crypto" pagesList={ProjectPages} />
        <CryptoMarketProject />
      </Layout>
    </ProjectDataContext.Provider>
  );
};

export default CryptoMarketProjectPage;
