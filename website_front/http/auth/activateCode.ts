import { API } from "../../config/api";
import getWalletToken from "../getWalletToken";

export default async (code: string): Promise<boolean> => {
  try {
    const token = getWalletToken();

    const res = await fetch(`${API}/ref/activate/${code}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const isValid = await res.json();

    return isValid;
  } catch (error) {
    console.log(error);

    return false;
  }
};
