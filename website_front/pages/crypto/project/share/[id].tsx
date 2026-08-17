import React from "react";
import ShareProject from "../../../../components/layouts/projects/Projects/Share";
import Footer from "../../../../components/global/Footer";

const ShareProjectPage = () => {
  return (
    <>
      <ShareProject />
      <br />
      <br />
      <Footer />
    </>
  );
};

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default ShareProjectPage;
