import { API, REF_LINK } from "../../config/api";
import { UserType } from "../../types/global_types";
import getWalletToken from "../getWalletToken";

export default async (): Promise<any> => {
  try {
    const token: string | null = getWalletToken();
    const userData: UserType = JSON.parse(
      localStorage.getItem("fomo-user") || ""
    );

    const res = await fetch(`${API}/ref`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const code: string = await res.text();

    return `${REF_LINK}${userData._id}/${code}`;
  } catch (error) {
    console.log(error);

    return false;
  }
};
