import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import Spaceport from "../../components/layouts/Cave";
import { GemsLabPages } from "../../staticContent/gemslab";
import PageNotReady from "../../components/global/PageNotReady";

const CalendarPage = () => {
  return (
    <Layout title="FomoLand: GemsLab/Spaceport">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <Spaceport /> */}
      <PageNotReady />
    </Layout>
  );
};
export default CalendarPage;
