import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import SocialNetworks from "../../../components/layouts/projects/SocialNetworks";
import PageNotReady from "../../../components/global/PageNotReady";

const SocialNetworkPage = () => {
  return (
    <Layout title="FomoLand: Utility/L2 Social network">
      <Navigation project="utility" pagesList={UtilityPages} />
      {/* <SocialNetworks /> */}
      <PageNotReady />
    </Layout>
  );
};

export default SocialNetworkPage;
