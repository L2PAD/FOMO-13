import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { ProjectPages } from "../../../staticContent/tabs";
import BreadCrumbs from "../../../components/global/BreadCrumbs";
import { EarlylandCalendar } from "../../../components/layouts/projects/Crypto/Earlyland/Calendar";
import { PageWrapper } from "../../../components/layouts/projects/Connection/styles";

const crumbs = [
  { title: "EarlyLand", link: "/crypto/earlyland" },
  { title: "Calendar", link: "/crypto/earlyland/calendar" },
];

const EarlylandCalendarPage = () => {
  return (
    <Layout title="FomoLand: Crypto / Earlyland / Calendar">
      <Navigation project="crypto" pagesList={ProjectPages} />
      <PageWrapper>
        <div style={{ padding: "18px 0 14px" }}>
          <BreadCrumbs items={crumbs} />
        </div>
        <EarlylandCalendar />
      </PageWrapper>
    </Layout>
  );
};

export default EarlylandCalendarPage;
