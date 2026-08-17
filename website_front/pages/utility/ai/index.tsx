import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import FomoAiPage from "../../../components/layouts/fomoAi";

const FomoAi = () => {
  return (
    <Layout title="FOMO AI — Your crypto intelligence layer">
      <Navigation project="utility" pagesList={UtilityPages} />
      <FomoAiPage />
    </Layout>
  );
};

export default FomoAi;
