 import { GetServerSideProps } from "next";
import { sitemapSiteUrl } from "../helpers/sitemap";

const Robots = () => null;

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteUrl = sitemapSiteUrl();
  const robots = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /auth/",
    "Disallow: /dashboard/",
    "Disallow: /core/profile/",
    "Disallow: /core/portfolio/",
    "Disallow: /utility/my-deals/",
    "Disallow: /utility/dash/",
    "Disallow: /utility/parcing/",
    "Disallow: /utility/parsing/",
    "",
    `Sitemap: ${siteUrl}/sitemap.xml`,
    "",
  ].join("\n");

  res.setHeader("Content-Type", "text/plain");
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400"
  );
  res.write(robots);
  res.end();

  return {
    props: {},
  };
};

export default Robots;
