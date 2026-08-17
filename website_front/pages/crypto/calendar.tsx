import React from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { ProjectPages } from "../../staticContent/tabs";
import Calendar from "../../components/layouts/projects/Calendar";

const CalendarPage = () => {
  return (
    <Layout title="FomoLand: Crypto/Calendar">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Calendar />
    </Layout>
  );
};
export default CalendarPage;
