import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import TabPage from "../../components/layouts/projects/CryptoMarket/tab-page";
import { ProjectPages } from "../../staticContent/tabs";
import PageNotReady from "../../components/global/PageNotReady";
import EralashLayout from "../../components/layouts/projects/Eralash";
import FomiesLayout from "../../components/layouts/projects/Fomies";

const FomiesPage = () => {
  return (
    <Layout title="FOMO: Crypto/Fomies">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <FomiesLayout />
    </Layout>
  );
};

export default FomiesPage;
