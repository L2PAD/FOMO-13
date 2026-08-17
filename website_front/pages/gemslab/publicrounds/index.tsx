import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Accelerator from "../../../components/layouts/gemslab/Accelerator";
import PageNotReady from "../../../components/global/PageNotReady";

const AcceleratorPage = () => {
  return (
    <Layout title="FomoLand: GemsLab/Public rounds">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <Accelerator
        name="Public rounds"
        title="The best crypto projects to invest in from the whole market."
        subtitle="The most promising projects to invest in, checked and approved by Fomoland. Here you will find projects of different types and purposes. Games, protocols, technologies and more. All those projects will сoincide with Fomoland standards. Find everything about the project and its founders, make decision and invest."
      /> */}
      <PageNotReady />
    </Layout>
  );
};

export default AcceleratorPage;
