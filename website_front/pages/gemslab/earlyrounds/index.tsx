import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Accelerator from "../../../components/layouts/gemslab/Accelerator";
import PageNotReady from "../../../components/global/PageNotReady";

const AcceleratorPage = () => {
  return (
    <Layout title="FomoLand: GemsLab/Early rounds">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <Accelerator
        name="Early rounds"
        title="Promising projects to invest in on early stages"
        subtitle="Fomoland is bringing changes to the market. Here you will find promising  cryptoprojects before everyone else does. It means you can participate in a project with the most beneficial terms."
      /> */}
      <PageNotReady />
    </Layout>
  );
};

export default AcceleratorPage;
