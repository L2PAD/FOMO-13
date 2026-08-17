import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

const reportMessage = async (
  messageId: string
): Promise<{ isSuccess: boolean; error: string }> => {
  try {
    const accessToken: string | null = getAccessToken();

    const res = await fetch(configureUrl(`messages/report/${messageId}`), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, error: data?.message || "" };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, error: "" };
  }
};

export default reportMessage;
