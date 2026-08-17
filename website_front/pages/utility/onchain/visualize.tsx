import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import VisualizeLayout from "../../../components/layouts/projects/Onchain/Visualize";
import PageNotReady from "../../../components/global/PageNotReady";

const OnChain = () => {
  return (
    <Layout title="FomoLand: Гtility/L1 On-chain">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <VisualizeLayout /> */}
      <PageNotReady />
    </Layout>
  );
};

export default OnChain;
