import { API } from "../../config/api";
import { RegistrationType } from "../../types/global_types";
import getAuthToken from "../getAuthToken";
import getWalletToken from "../getWalletToken";

export default async (): Promise<{
  isSuccess: boolean;
  qr: any;
  setupKey: string;
}> => {
  try {
    const token = getAuthToken();

    const res = await fetch(`${API}/auth/2fa/setup`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    return { isSuccess: true, qr: data.qrCodeImage, setupKey: data.setupKey };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, qr: "", setupKey: "" };
  }
};
