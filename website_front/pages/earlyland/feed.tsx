import React from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import {
  EarlylandLogoutPages,
  EarlylandPages,
} from "../../staticContent/earlyland";
import FeedPage from "../../components/layouts/earlyland/Feed";
import { authState } from "../../store/slices/authSlice";
import PageNotReady from "../../components/global/PageNotReady";

const CalendarPage = () => {
  const { isLogin } = useSelector(authState);

  return (
    <Layout title="Fomoland: EarlyLand">
      <Navigation project="earlyland" pagesList={EarlylandPages} />
      {/* <FeedPage /> */}
      <PageNotReady />
    </Layout>
  );
};
export default CalendarPage;
