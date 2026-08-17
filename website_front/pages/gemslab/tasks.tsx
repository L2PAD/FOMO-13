import React from "react";
import Navigation from "../../components/global/Navigation";
import Layout from "../../components/global/Layout";
import Tasks from "../../components/layouts/gemslab/Tasks";
import { GemsLabPages } from "../../staticContent/gemslab";
import PageNotReady from "../../components/global/PageNotReady";

const TasksPage = () => {
  return (
    <Layout title="Fomoland: Gemslab">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      {/* <Tasks /> */}
      <PageNotReady />
    </Layout>
  );
};

export default TasksPage;
