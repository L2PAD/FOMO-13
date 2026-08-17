import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import ParcingLayout from "../../../components/layouts/projects/Parsing";
import PageNotReady from "../../../components/global/PageNotReady";

const ParsingPage = () => {
  return (
    <Layout title="FomoLand: Utility/Analytics">
      <Navigation project="utility" pagesList={UtilityPages} />
      <ParcingLayout />
      {/* <PageNotReady/> */}
    </Layout>
  );
};

export default ParsingPage;
