import { ICryptoTab } from "../../components/layouts/projects/CryptoMarket/createTabContext";
import { buildTabHubUrl } from "./tabhubApi";

export default async (): Promise<{
  isSuccess: boolean;
  items: Array<ICryptoTab>;
  tabs: Array<ICryptoTab>;
}> => {
  try {
    const res = await fetch(buildTabHubUrl("home"), {
      method: "GET",
    });

    const data = await res.json();
    const items = data?.items || [];

    return {
      isSuccess: res.status < 300,
      items,
      tabs: items,
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      items: [],
      tabs: [],
    };
  }
};
