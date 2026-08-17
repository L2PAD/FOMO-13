import getAuthToken from "../getAuthToken";
import { API } from "../../config/api";

const checkBlocked = async (userId: string): Promise<{ isBlocked: boolean; isBlockedByThem: boolean; error?: string }> => {
    try {
        const response = await fetch(`${API}/user/block/check/${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${getAuthToken()}`,
            },
        });

        if (!response.ok) {
            return { isBlocked: false, isBlockedByThem: false, error: "Failed to check block status" };
        }

        const data = await response.json();
        return { isBlocked: data.isBlocked, isBlockedByThem: data.isBlockedByThem };
    } catch (error) {
        return { isBlocked: false, isBlockedByThem: false, error: "Network error" };
    }
};

export default checkBlocked;
