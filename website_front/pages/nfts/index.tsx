import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { NFTsPages } from "../../staticContent/nfts/global";
import Projects from "../../components/layouts/projects/Projects";
import PageNotReady from "../../components/global/PageNotReady";

const NTFsPage = () => {
  return (
    <Layout title="Fomoland: NFTs">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Projects /> */}
      <PageNotReady />
    </Layout>
  );
};

export default NTFsPage;
