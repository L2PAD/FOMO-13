import React from "react";
import Footer from "../../../../components/global/Footer";
import ShareProject from "../../../../components/layouts/projects/Projects/Share";
import Layout from "../../../../components/global/Layout";
import Navigation from "../../../../components/global/Navigation";
import { NFTsPages } from "../../../../staticContent/nfts/global";
import PageNotReady from "../../../../components/global/PageNotReady";

const ShareProjectPage = () => {
  return (
    <Layout title="Fomoland: NFTs">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <ShareProject />
      <br />
      <br />
      <Footer /> */}
      <PageNotReady />
    </Layout>
  );
};

export default ShareProjectPage;
