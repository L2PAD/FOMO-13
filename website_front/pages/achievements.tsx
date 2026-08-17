/* eslint-disable */
import React, { FC } from "react";
import Layout from "../components/global/Layout";
import Navigation from "../components/global/Navigation";
import { ProjectPages } from "../staticContent/tabs";
import AchievementsShowcase from "../components/layouts/achievements";

const Page: FC = () => {
  return (
    <Layout
      title="Achievements & Badges | FOMO"
      description="Explore platform-wide FOMO achievements — earn badges across staking, trading, activity, launchpad and more."
      canonical="/achievements"
    >
      <Navigation project="crypto" pagesList={ProjectPages} />
      <AchievementsShowcase />
    </Layout>
  );
};

export default Page;
