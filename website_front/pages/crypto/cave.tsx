import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { ProjectPages } from "../../staticContent/tabs";
import Cave from "../../components/layouts/Cave";

const CalendarPage = () => {
  return (
    <Layout title="FomoLand: Crypto/Calendar">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Cave />
    </Layout>
  );
};
export default CalendarPage;
