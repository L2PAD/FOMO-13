import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import Projects from "../../../components/layouts/nfts/Projects";
import { NFTsPages } from "../../../staticContent/nfts/global";
import PageNotReady from "../../../components/global/PageNotReady";

const NTFsPage = () => {
  return (
    <Layout title="Fomoland: NFTs/Minting">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Projects /> */}
      <PageNotReady />
    </Layout>
  );
};

export default NTFsPage;
