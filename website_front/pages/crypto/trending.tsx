import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import TabPage from "../../components/layouts/projects/CryptoMarket/tab-page";
import { ProjectPages } from "../../staticContent/tabs";

const CryptoMarketPage = () => {
  return (
    <Layout title="FOMO: Crypto/Crypto market">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <TabPage tabType="trending" />
    </Layout>
  );
};

export default CryptoMarketPage;
