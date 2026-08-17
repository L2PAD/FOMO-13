import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import { EarlylandPage } from '../../../components/layouts/projects/Crypto/Earlyland/index';

const Earlyland = () => {
  return (
    <Layout title="FomoLand: Utility/Earlyland">
      <Navigation project="utility" pagesList={UtilityPages} />
      <EarlylandPage />
    </Layout>
  );
};

export default Earlyland;
