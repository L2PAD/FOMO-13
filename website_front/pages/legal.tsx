import React from "react";
import { useRouter } from "next/router";
import Layout from "../components/global/Layout";
import Navigation from "../components/global/Navigation";
import { ProjectPages } from "../staticContent/tabs";
import Legal, {
  LEGAL_DOCUMENTS,
  resolveLegalType,
} from "../components/global/Legal";

const LegalPage = () => {
  const router = useRouter();
  const type = resolveLegalType(router.query.type);
  const document = LEGAL_DOCUMENTS[type];

  return (
    <Layout
      title={`${document.title} | FOMO`}
      description={document.description}
      canonical={`/legal?type=${type}`}
    >
      <Navigation project="crypto" pagesList={ProjectPages} />
      <Legal />
    </Layout>
  );
};

export default LegalPage;
