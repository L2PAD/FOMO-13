import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

const blockUser = async (
  userId: string
): Promise<{ isSuccess: boolean; error?: string }> => {
  try {
    const response = await fetch(configureUrl(`user/block/${userId}`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        isSuccess: false,
        error: errorData.message || "Failed to block user",
      };
    }

    return { isSuccess: true };
  } catch (error) {
    return { isSuccess: false, error: "Network error" };
  }
};

export default blockUser;
