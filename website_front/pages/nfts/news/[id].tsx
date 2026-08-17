import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import NewsItemPage from "../../../components/layouts/projects/News/NewsItemPage";
import { NFTsPages } from "../../../staticContent/nfts/global";
import PageNotReady from "../../../components/global/PageNotReady";

const NewsPage = () => {
  return (
    <Layout title="FomoLand: NFTs/News">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <NewsItemPage /> */}
      <PageNotReady />
    </Layout>
  );
};
export default NewsPage;
