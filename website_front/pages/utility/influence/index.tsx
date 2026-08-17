import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import Influence from "../../../components/layouts/projects/Influence";
import { UtilityPages } from "../../../staticContent/tabs";

const InfluencePage = () => {
  return (
    <Layout title="FomoLand: Connection">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Influence />
    </Layout>
  );
};

export default InfluencePage;
