export const getServerSideProps = async (context: any) => {
  const queryString = new URLSearchParams(context.query || {}).toString();
  const destination = queryString
    ? `/core/fomo-chat?${queryString}`
    : "/core/fomo-chat";

  return {
    redirect: {
      destination,
      permanent: false,
    },
  };
};

const UtilityFomoChatRedirectPage = () => null;

export default UtilityFomoChatRedirectPage;
