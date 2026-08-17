import React from "react";
import Navigation from "../../../components/global/Navigation";
import { UtilityPages } from "../../../staticContent/tabs";
import Layout from "../../../components/global/Layout";
import MembershipsPage from "../../../components/layouts/memberships";

const Memberships = () => {
  return (
    <Layout title="Memberships — FOMO AI & FOMO Intel">
      <Navigation project="utility" pagesList={UtilityPages} />
      <MembershipsPage />
    </Layout>
  );
};

export default Memberships;
