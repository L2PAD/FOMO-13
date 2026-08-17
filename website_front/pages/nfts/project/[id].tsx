import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { NFTsPages } from "../../../staticContent/nfts/global";
import PageNotReady from "../../../components/global/PageNotReady";
import Project from "../../../components/layouts/projects/Projects/Project";

const NTFsPage = () => {
  return (
    <Layout title="Fomoland: NFTs">
      <Navigation project="nfts" pagesList={NFTsPages} />
      <PageNotReady />
      {/* <Project /> */}
    </Layout>
  );
};

export default NTFsPage;
