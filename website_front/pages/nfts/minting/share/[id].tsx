import React from "react";
import ShareProject from "../../../../components/layouts/nfts/Projects/Share";
import Footer from "../../../../components/global/Footer";
import Navigation from "../../../../components/global/Navigation";
import Layout from "../../../../components/global/Layout";
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
