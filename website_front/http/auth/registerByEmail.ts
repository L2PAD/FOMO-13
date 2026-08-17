import { API } from "../../config/api";
import { RegistrationType } from "../../types/global_types";
import getWalletToken from "../getWalletToken";

export default async (registrationData: RegistrationType): Promise<boolean> => {
  try {
    const token = getWalletToken();

    const res = await fetch(`${API}/user/registration`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registrationData),
    });

    const data = await res.json();

    if (data?.statusCode > 300) {
      return false;
    }

    return true;
  } catch (error) {
    console.log(error);

    return false;
  }
};
