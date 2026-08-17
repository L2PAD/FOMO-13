import React from "react";
import Navigation from "../../../components/global/Navigation";
import Layout from "../../../components/global/Layout";
import Persons from "../../../components/layouts/nfts/Persons";
import { NFTsPages } from "../../../staticContent/nfts/global";
import PageNotReady from "../../../components/global/PageNotReady";

const PersonsPage = () => {
  return (
    <Layout title="FomoLand: NFTs/Persons">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Persons /> */}
      <PageNotReady />
    </Layout>
  );
};

export default PersonsPage;
