import { GetServerSideProps } from "next";
import {
  buildSitemapXml,
  collectSitemapEntries,
} from "../helpers/sitemap";

const Sitemap = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const entries = await collectSitemapEntries();
  const sitemap = buildSitemapXml(entries);

  res.setHeader("Content-Type", "application/xml");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default Sitemap;
