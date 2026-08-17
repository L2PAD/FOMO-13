import { API, REF_LINK } from "../../config/api";
import { UserType } from "../../types/global_types";
import getWalletToken from "../getWalletToken";

export interface ISupport {
  theme: string;
  message: string;
  category: string;
  date: Date | string;
  file?: any | undefined;
}

export default async (messageData: any): Promise<any> => {
  try {
    const token: string | null = getWalletToken();

    const res = await fetch(`${API}/support`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: messageData,
    });

    return { success: res.status < 300 };
  } catch (error) {
    console.log(error);

    return { success: false };
  }
};
