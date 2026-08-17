import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import Networks from "../../../components/layouts/projects/Networks";
import PageNotReady from "../../../components/global/PageNotReady";

const NetworkPage = () => {
  return (
    <Layout title="FomoLand: Utility/L1 Public network">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <Networks /> */}
      <PageNotReady />
    </Layout>
  );
};

export default NetworkPage;
