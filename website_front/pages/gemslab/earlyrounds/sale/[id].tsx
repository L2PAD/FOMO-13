import React from "react";
import Layout from "../../../../components/global/Layout";
import Navigation from "../../../../components/global/Navigation";
import { GemsLabPages } from "../../../../staticContent/gemslab";
import Sale from "../../../../components/layouts/gemslab/Sale";

const SalePage = () => {
  return (
    <Layout title="FomoLand: GemsLab">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      <Sale />
    </Layout>
  );
};
export default SalePage;
