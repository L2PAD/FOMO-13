import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import AcceleratorProject from "../../../components/layouts/gemslab/Accelerator/Project";
import PageNotReady from "../../../components/global/PageNotReady";

const AcceleratorIdPage = () => {
  return (
    <Layout title="FomoLand: GemsLab">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <AcceleratorProject /> */}
      <PageNotReady />
    </Layout>
  );
};
export default AcceleratorIdPage;
