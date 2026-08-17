import React from "react";
import { useSelector } from "react-redux";
import Layout from "../../components/global/Layout";
import Navigation from "../../components/global/Navigation";
import Calendar from "../../components/layouts/earlyland/Calendar";
import { EarlylandPages } from "../../staticContent/earlyland";
import { authState } from "../../store/slices/authSlice";
import PageNotReady from "../../components/global/PageNotReady";

const CalendarPage = () => {
  const { isLogin } = useSelector(authState);

  return (
    <Layout title="Fomoland: EarlyLand">
      <Navigation project="earlyland" pagesList={EarlylandPages} />
      {/* <Calendar /> */}
      <PageNotReady />
    </Layout>
  );
};
export default CalendarPage;
