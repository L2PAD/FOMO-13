/* eslint-disable */
import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import IcoProject from "../../../components/layouts/projects/Crypto/Project";
import { ProjectPages } from "../../../staticContent/tabs";
import fetchProjectById from "../../../http/projects/fetchProjectById";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import Loader from "../../../components/global/loader";
import { ProjectDataContext } from "../../../contexts/projectDataContext";

const ICOProjectPage = () => {
  const id: any = useRouter().query?.id;

  const { data, isLoading, refetch } = useQuery(
    ["ico-project-page", id],
    () => {
      if (!id) return;
      return fetchProjectById(
        String(id),
        "?projectType=project&lookup=slug"
      );
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
      <Layout title="FOMO: Project">
        <Navigation project="crypto" pagesList={ProjectPages} />
        <IcoProject />
      </Layout>
    </ProjectDataContext.Provider>
  );
};

export default ICOProjectPage;
