import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import TabPage from "../../components/layouts/projects/CryptoMarket/tab-page";
import { ProjectPages } from "../../staticContent/tabs";
import PageNotReady from "../../components/global/PageNotReady";
import EralashLayout from "../../components/layouts/projects/Eralash";

const EralashPage = () => {
  return (
    <Layout title="FOMO: Crypto/Eralash">
      <Navigation project="crypto" pagesList={ProjectPages} />
      {/* <PageNotReady/> */}
      <EralashLayout />
    </Layout>
  );
};

export default EralashPage;
