import { GetServerSideProps } from "next";

/**
 * Legacy `/earlyland` landing removed — the canonical EarlyLand experience lives
 * at `/crypto/earlyland` (light-themed, designed). Redirect any old links/ads here.
 */
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/crypto/earlyland", permanent: false },
});

export default function EarlyLandRedirect() {
  return null;
}
