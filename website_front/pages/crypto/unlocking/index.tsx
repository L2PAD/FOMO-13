import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import Unlocking from "../../../components/layouts/projects/Unlocking";
import PageNotReady from "../../../components/global/PageNotReady";

const AnalyticsPage = () => {
  return (
    <Layout title="Fomoland: Crypto/Unlocking">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Unlocking />
      {/* <PageNotReady/> */}
    </Layout>
  );
};
export default AnalyticsPage;
