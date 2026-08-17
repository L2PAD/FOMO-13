import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import News from "../../../components/layouts/nfts/News";
import { NFTsPages } from "../../../staticContent/nfts/global";
import PageNotReady from "../../../components/global/PageNotReady";

const NewsPage = () => {
  return (
    <Layout title="FomoLand: NFTs/News">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <News /> */}
      <PageNotReady />
    </Layout>
  );
};
export default NewsPage;
