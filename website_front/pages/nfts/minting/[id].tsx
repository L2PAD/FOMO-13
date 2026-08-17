import React, { FC, createContext } from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { NFTsPages } from "../../../staticContent/nfts/global";
import Project from "../../../components/layouts/nfts/Projects/Project";
import fetchProjectById from "../../../http/projects/fetchProjectById";
import { IProject } from "../../../types/global_types";
import PageNotReady from "../../../components/global/PageNotReady";

export const getServerSideProps = async (context: any) => {
  const { id } = context.params;

  const { isSuccess, project } = await fetchProjectById(id);

  if (!isSuccess) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  return { props: { nft: project } };
};

interface IProps {
  nft: IProject;
}

export const ProjectDataContext = createContext<IProject>({
  name: "",
  status: "Active",
  niche: "",
  totalRaised: "",
  rating: "",
  fullness: "",
  banner: "",
  lastFunding: new Date(),
  investors: [],
});

const NTFsPage: FC<IProps> = ({ nft }) => {
  return (
    <ProjectDataContext.Provider value={nft}>
      <Layout title="Fomoland: NFTs">
        <Navigation project="nfts" pagesList={NFTsPages} />
        {/* <Project /> */}
        <PageNotReady />
      </Layout>
    </ProjectDataContext.Provider>
  );
};

export default NTFsPage;
