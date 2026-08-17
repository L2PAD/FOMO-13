import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import OnchainProjectPage from "../../../components/layouts/projects/Onchain/Project";
import PageNotReady from "../../../components/global/PageNotReady";

const OnChain = () => {
  return (
    <Layout title="FomoLand: Utilitys/L1 On-chain">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <OnchainProjectPage /> */}
      <PageNotReady />
    </Layout>
  );
};

export default OnChain;
