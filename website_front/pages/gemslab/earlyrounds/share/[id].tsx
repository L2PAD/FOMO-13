import React from "react";
import Footer from "../../../../components/global/Footer";
// eslint-disable-next-line import/no-named-as-default
import ShareAcceleratorProject from "../../../../components/layouts/gemslab/Accelerator/Share";

const ShareAcceleratorProjectPage = () => {
  return (
    <>
      <ShareAcceleratorProject />
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

export default ShareAcceleratorProjectPage;
