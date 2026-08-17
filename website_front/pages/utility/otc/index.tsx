import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import OTC from "../../../components/layouts/projects/OTC";

const OTCPage = () => {
  return (
    <Layout title="FomoLand: Utility/OTC">
      <Navigation project="utility" pagesList={UtilityPages} />
      <OTC />
    </Layout>
  );
};
export default OTCPage;
