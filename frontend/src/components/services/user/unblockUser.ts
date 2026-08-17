import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

const unblockUser = async (
  userId: string
): Promise<{ isSuccess: boolean; error?: string }> => {
  try {
    const response = await fetch(configureUrl(`user/block/${userId}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        isSuccess: false,
        error: errorData.message || "Failed to unblock user",
      };
    }

    return { isSuccess: true };
  } catch (error) {
    return { isSuccess: false, error: "Network error" };
  }
};

export default unblockUser;
