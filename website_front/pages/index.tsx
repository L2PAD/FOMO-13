import React from "react";
import Layout from "../components/global/Layout";
import Navigation from "../components/global/Navigation";
import { ProjectPages } from "../staticContent/tabs";
import CryptoMarketPageLayout from "../components/layouts/projects/CryptoMarket";

const CryptoMarketPage = () => {
  return (
    <Layout title="FOMO: Crypto, Crypto market">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <CryptoMarketPageLayout />
    </Layout>
  );
};

export default CryptoMarketPage;
