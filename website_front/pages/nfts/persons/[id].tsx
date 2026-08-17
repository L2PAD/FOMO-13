import React from "react";
import Navigation from "../../../components/global/Navigation";
import Layout from "../../../components/global/Layout";
import Person from "../../../components/layouts/nfts/Persons/Person";
import { NFTsPages } from "../../../staticContent/nfts/global";
import PageNotReady from "../../../components/global/PageNotReady";

const PersonPage = () => {
  return (
    <Layout title="FomoLand: NFTs">
      <Navigation project="nfts" pagesList={NFTsPages} />
      {/* <Person /> */}
      <PageNotReady />
    </Layout>
  );
};

export default PersonPage;
