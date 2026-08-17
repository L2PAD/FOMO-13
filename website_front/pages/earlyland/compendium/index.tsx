import React from "react";
import { useSelector } from "react-redux";
import Layout from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import {
  EarlylandLogoutPages,
  EarlylandPages,
} from "../../../staticContent/earlyland";
import CompendiumPage from "../../../components/layouts/earlyland/Compendium";
import { authState } from "../../../store/slices/authSlice";
import PageNotReady from "../../../components/global/PageNotReady";

const NTFsPage = () => {
  const { isLogin } = useSelector(authState);

  return (
    <Layout title="Fomoland: EarlyLand">
      <Navigation project="earlyland" pagesList={EarlylandPages} />
      {/* <CompendiumPage /> */}
      <PageNotReady />
    </Layout>
  );
};

export default NTFsPage;
