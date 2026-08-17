/* eslint-disable */
import React, { FC } from "react";
import Layout from "../components/global/Layout";
import Navigation from "../components/global/Navigation";
import { ProjectPages } from "../staticContent/tabs";
import FAQPage from "../components/global/FAQPage";
import { FAQItem } from "../types/global_types";
import fetchFaq from "../http/faq/fetchFaq";

export const getServerSideProps = async (context: any) => {
  const { isSuccess, faq } = await fetchFaq();

  if (!isSuccess) {
    return {
      redirect: {
        destination: "/404",
        permanent: false,
      },
    };
  }

  return { props: { faq } };
};

interface IProps {
  faq: Array<FAQItem>;
}

const Page: FC<IProps> = ({ faq }) => {
  return (
    <Layout
      title="Frequently Asked Questions | FOMO"
      description="Find answers about FOMO features, accounts, platform data, security, and market risks."
      canonical="/faq"
    >
      <Navigation project="crypto" pagesList={ProjectPages} />
      <FAQPage faq={faq} />
    </Layout>
  );
};

export default Page;
