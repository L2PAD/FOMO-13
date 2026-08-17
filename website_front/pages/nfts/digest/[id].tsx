import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { NFTsPages } from "../../../staticContent/nfts/global";
import DigestItemPage from "../../../components/layouts/projects/News/DigestItemPage";

const DigestPage = () => {
  return (
    <Layout title="FomoLand: NFTs/Market Digest">
      <Navigation project="nfts" pagesList={NFTsPages} />
      <DigestItemPage />
    </Layout>
  );
};
export default DigestPage;
