import React from "react";
import Navigation from "../../../components/global/Navigation";
import Layout from "../../../components/global/Layout";
import { NFTsPages } from "../../../staticContent/nfts/global";
import Card from "../../../components/layouts/projects/Projects/Project/Card";
import PageNotReady from "../../../components/global/PageNotReady";

const CardIdPage = () => {
  return (
    <Layout title="FomoLand: NFTs">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Card /> */}
      <PageNotReady />
    </Layout>
  );
};

export default CardIdPage;
