import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { GemsLabPages } from "../../../staticContent/gemslab";
import Accelerator from "../../../components/layouts/gemslab/Accelerator";
import PageNotReady from "../../../components/global/PageNotReady";

const AcceleratorPage = () => {
  return (
    <Layout title="FomoLand: GemsLab/NFT Launch">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <Accelerator
        name="NFT Launch"
        title="Universal NFT launchpad which enables projects to launch their IDO and INO"
        subtitle="Expanding cryptomarket is a noble crusade. Fomoland will help projects to start their journey and will try its very best to see the  success of those projects later. Have idea? Join us and launch successfully your IDO or INO"
      /> */}
      <PageNotReady />
    </Layout>
  );
};

export default AcceleratorPage;
