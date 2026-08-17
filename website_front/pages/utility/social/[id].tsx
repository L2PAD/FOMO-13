import React from "react";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Person from "../../../components/layouts/projects/Persons/SocialPerson";

const AnalyticsUserPage = () => {
  return (
    <Layout title="FomoLand: Projects/L2 Social network">
      <Navigation project="utility" pagesList={UtilityPages} />
      <Person />
    </Layout>
  );
};
export default AnalyticsUserPage;
