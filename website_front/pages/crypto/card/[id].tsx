import React from "react";
import Navigation from "../../../components/global/Navigation";
import Layout from "../../../components/global/Layout";
import { NFTsPages } from "../../../staticContent/nfts/global";
import Card from "../../../components/layouts/projects/Projects/Project/Card";

const CardIdPage = () => {
  return (
    <Layout title="Fomoland: NFTs">
      <Navigation project="" pagesList={NFTsPages} />
      <Card />
    </Layout>
  );
};

export default CardIdPage;
