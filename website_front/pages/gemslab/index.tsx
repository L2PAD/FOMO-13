import React, { useEffect } from "react";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import { GemsLabPages } from "../../staticContent/gemslab";
import { useRouter } from "next/router";
import PageNotReady from "../../components/global/PageNotReady";

const ProjectsPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.push("/gemslab/profile");
  }, [router]);

  return (
    <Layout title="FomoLand: GemsLab">
      <Navigation project="gemslab" pagesList={GemsLabPages} />
      <PageNotReady />
    </Layout>
  );
};
export default ProjectsPage;
