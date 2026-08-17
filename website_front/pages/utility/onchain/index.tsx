import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import OnChainPage from "../../../components/layouts/projects/Onchain";
import PageNotReady from "../../../components/global/PageNotReady";

const OnChain = () => {
  return (
    <Layout title="FomoLand: Utility/L0 On-chain">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <OnChainPage /> */}
      <PageNotReady />
    </Layout>
  );
};

export default OnChain;
