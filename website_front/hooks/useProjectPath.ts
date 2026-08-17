import { useRouter } from "next/router";

const useProjectPath = () => {
  const location = useRouter().pathname.split("/")[1];

  const path = useRouter().pathname.split("/")[1];

  if (path === "fund") return "funds";

  if (path === "person") return "persons";

  switch (location) {
    case "projects":
      return "projects";
    case "nfts":
      return "nfts";
    case "early_land":
      return "earlyland";
    case "gems_lab":
      return "gemslab";
    default:
      break;
  }
};

export default useProjectPath;
